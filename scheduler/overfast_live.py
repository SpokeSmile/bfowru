from dataclasses import dataclass

from django.utils import timezone

from .models import OverwatchStatsCache
from .overfast_client import (
    OverfastError,
    fetch_overfast_stats,
    fetch_overfast_summary,
    normalize_battle_tag,
)
from .overfast_sync import OVERFAST_MODES, primary_battle_tag


@dataclass
class LiveOverwatchStatsRecord:
    player: object
    battle_tag: str
    overfast_player_id: str
    mode: str
    status: str
    error: str
    summary_json: dict
    stats_json: dict
    fetched_at: object


def live_missing_battletag_record(player, mode, fetched_at):
    return LiveOverwatchStatsRecord(
        player=player,
        battle_tag='',
        overfast_player_id='',
        mode=mode,
        status=OverwatchStatsCache.STATUS_MISSING_BATTLETAG,
        error='BattleTag не указан.',
        summary_json={},
        stats_json={},
        fetched_at=fetched_at,
    )


def live_error_record(player, battle_tag, player_id, mode, summary, message, fetched_at):
    return LiveOverwatchStatsRecord(
        player=player,
        battle_tag=battle_tag,
        overfast_player_id=player_id,
        mode=mode,
        status=OverwatchStatsCache.STATUS_ERROR,
        error=message,
        summary_json=summary or {},
        stats_json={},
        fetched_at=fetched_at,
    )


def live_ready_record(player, battle_tag, player_id, mode, summary, stats, fetched_at):
    return LiveOverwatchStatsRecord(
        player=player,
        battle_tag=battle_tag,
        overfast_player_id=player_id,
        mode=mode,
        status=OverwatchStatsCache.STATUS_READY,
        error='',
        summary_json=summary or {},
        stats_json=stats or {},
        fetched_at=fetched_at,
    )


def fetch_live_overwatch_records(players, mode=OverwatchStatsCache.COMPETITIVE):
    if mode not in OVERFAST_MODES:
        mode = OverwatchStatsCache.COMPETITIVE

    fetched_at = timezone.now()
    records = []

    for player in players:
        # Product rule: only the first BattleTag is authoritative for stats v1.
        battle_tag = primary_battle_tag(player)
        player_id = normalize_battle_tag(battle_tag)
        if not player_id:
            records.append(live_missing_battletag_record(player, mode, fetched_at))
            continue

        try:
            summary = fetch_overfast_summary(player_id)
        except OverfastError as exc:
            records.append(live_error_record(player, battle_tag, player_id, mode, {}, str(exc), fetched_at))
            continue

        try:
            stats = fetch_overfast_stats(player_id, mode)
        except OverfastError as exc:
            records.append(live_error_record(player, battle_tag, player_id, mode, summary, str(exc), fetched_at))
            continue

        records.append(live_ready_record(player, battle_tag, player_id, mode, summary, stats, fetched_at))

    return records
