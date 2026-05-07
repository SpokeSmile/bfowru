from .models import OverwatchStatsCache, Player
from .overfast_client import normalize_battle_tag
from .overfast_metrics import (
    RANK_LABELS,
    average_eliminations,
    hero_label,
    hero_time_played,
    rank_distribution,
    rank_label_from_score,
    rank_rating_from_score,
    rank_score,
    normalize_rank_division,
    ratio,
    role_key_for_player,
    safe_number,
    weighted_mode_summary,
)
from .overfast_live import fetch_live_overwatch_records
from .overfast_sync import OVERFAST_MODES, primary_battle_tag

# The frontend consumes this payload directly. Avoid inventing fields that
# OverFast does not expose, such as match history, SR or win/loss streaks.


def serialize_rank(rank, role=''):
    score = rank_score(rank)
    if score is None:
        return None
    division = normalize_rank_division(rank.get('division'))
    tier = rank.get('tier')
    return {
        'division': division,
        'divisionLabel': RANK_LABELS.get(division, division.title()),
        'tier': tier,
        'label': f'{RANK_LABELS.get(division, division.title())} {tier}',
        'role': role,
        'rankIcon': rank.get('rank_icon') or '',
        'roleIcon': rank.get('role_icon') or '',
        'score': score,
        'rating': rank_rating_from_score(score),
    }


def select_rank(summary, player):
    competitive = (summary or {}).get('competitive') or {}
    platform_ranks = competitive.get('pc') or {}
    preferred_role = role_key_for_player(player)
    if preferred_role and platform_ranks.get(preferred_role):
        return serialize_rank(platform_ranks[preferred_role], preferred_role)

    ranked_roles = []
    for role in ['tank', 'damage', 'support', 'open']:
        serialized = serialize_rank(platform_ranks.get(role), role)
        if serialized:
            ranked_roles.append(serialized)
    if not ranked_roles:
        return None
    return max(ranked_roles, key=lambda item: item['score'])


def main_hero_from_stats(stats, hero_portraits=None):
    hero_portraits = hero_portraits or {}
    heroes = stats.get('heroes') or {}
    if not heroes:
        return None
    hero_key, payload = max(
        heroes.items(),
        key=lambda item: (hero_time_played(item[1]), safe_number(item[1].get('games_played'))),
    )
    return {
        'hero': hero_key,
        'heroLabel': hero_label(hero_key),
        'heroIconUrl': hero_portraits.get(hero_key, ''),
        'timePlayed': hero_time_played(payload),
        'matches': safe_number(payload.get('games_played')),
    }


def serialize_player_row(player, record, hero_portraits=None):
    status = record.status if record else OverwatchStatsCache.STATUS_ERROR
    stats = record.stats_json if record and record.stats_json else {}
    summary = record.summary_json if record and record.summary_json else {}
    general = stats.get('general') or {}
    total = general.get('total') or {}
    average = general.get('average') or {}
    wins = safe_number(general.get('games_won'))
    losses = safe_number(general.get('games_lost'))
    deaths = safe_number(total.get('deaths'))
    eliminations = safe_number(total.get('eliminations'))
    rank = select_rank(summary, player)
    main_hero = main_hero_from_stats(stats, hero_portraits)
    connection = player.discord_connection

    return {
        'id': player.id,
        'name': player.name,
        'role': player.role,
        'roleColor': player.role_color,
        'avatarUrl': connection.avatar_url if connection else '',
        'battleTag': record.battle_tag if record else primary_battle_tag(player),
        'playerId': record.overfast_player_id if record else normalize_battle_tag(primary_battle_tag(player)),
        'status': status,
        'error': record.error if record else 'Данные OverFast недоступны.',
        'updatedAt': record.fetched_at.isoformat() if record and record.fetched_at else '',
        'rank': rank,
        'winrate': safe_number(general.get('winrate')),
        'matches': safe_number(general.get('games_played')),
        'wins': wins,
        'losses': losses,
        'timePlayed': safe_number(general.get('time_played')),
        'kd': ratio(eliminations, deaths),
        'avgEliminations': average_eliminations(general),
        'avgDeaths': safe_number(average.get('deaths')),
        'mainHero': main_hero,
    }


def aggregate_top_heroes(records, hero_portraits=None):
    hero_portraits = hero_portraits or {}
    heroes = {}
    for record in records:
        if record.status != OverwatchStatsCache.STATUS_READY:
            continue
        for hero_key, payload in (record.stats_json.get('heroes') or {}).items():
            entry = heroes.setdefault(hero_key, {
                'hero': hero_key,
                'heroLabel': hero_label(hero_key),
                'matches': 0,
                'wins': 0,
                'losses': 0,
                'timePlayed': 0,
            })
            matches = safe_number(payload.get('games_played'))
            wins = safe_number(payload.get('games_won'))
            losses = safe_number(payload.get('games_lost'))
            entry['matches'] += matches
            entry['wins'] += wins
            entry['losses'] += losses
            entry['timePlayed'] += hero_time_played(payload)

    rows = []
    for entry in heroes.values():
        matches = entry['matches']
        rows.append({
            'hero': entry['hero'],
            'heroLabel': entry['heroLabel'],
            'heroIconUrl': hero_portraits.get(entry['hero'], ''),
            'matches': matches,
            'wins': entry['wins'],
            'losses': entry['losses'],
            'winrate': round((entry['wins'] / matches) * 100, 1) if matches else 0,
            'timePlayed': entry['timePlayed'],
        })
    return sorted(rows, key=lambda item: (item['timePlayed'], item['matches'], item['winrate']), reverse=True)[:5]


def build_overwatch_stats_dashboard(mode=OverwatchStatsCache.COMPETITIVE, hero_portraits=None):
    if mode not in OVERFAST_MODES:
        mode = OverwatchStatsCache.COMPETITIVE
    hero_portraits = hero_portraits or {}

    players = list(Player.objects.select_related('user__discord_connection').order_by('sort_order', 'id'))
    records = fetch_live_overwatch_records(players, mode)
    record_map = {(record.player.id, record.mode): record for record in records}
    selected_records = [record for record in records if record.mode == mode]
    rows = [
        serialize_player_row(player, record_map.get((player.id, mode)), hero_portraits)
        for player in players
    ]
    # Team-level cards are weighted by real win/loss counts, not by averaging
    # player percentages, so low-match accounts do not skew the dashboard.
    team_summary = weighted_mode_summary(selected_records, OverwatchStatsCache.STATUS_READY)
    rank_scores = [row['rank']['score'] for row in rows if row.get('rank')]
    average_rank_score = sum(rank_scores) / len(rank_scores) if rank_scores else None
    team_summary.update({
        'averageRank': rank_label_from_score(average_rank_score) if rank_scores else '—',
        'averageRankScore': round(average_rank_score, 1) if rank_scores else None,
        'averageRating': rank_rating_from_score(average_rank_score) if rank_scores else None,
        'unavailablePlayers': len([row for row in rows if row['status'] != OverwatchStatsCache.STATUS_READY]),
    })

    latest_record = max([record for record in records if record.fetched_at], key=lambda item: item.fetched_at, default=None)
    data_empty = not any(row['status'] == OverwatchStatsCache.STATUS_READY for row in rows)

    return {
        'mode': mode,
        'period': {'value': 'all_time', 'label': 'All-time'},
        'platform': 'pc',
        'updatedAt': latest_record.fetched_at.isoformat() if latest_record else '',
        'dataEmpty': data_empty,
        'live': True,
        'players': rows,
        'team': team_summary,
        'rankDistribution': rank_distribution(rows),
        'topHeroes': aggregate_top_heroes(selected_records, hero_portraits),
    }
