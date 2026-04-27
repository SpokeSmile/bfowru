from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .forms import ScheduleSlotForm
from .models import Player, ScheduleSlot


class ScheduleFormTests(TestCase):
    def test_allows_end_time_2400(self):
        form = ScheduleSlotForm(data={
            'slot_type': ScheduleSlot.AVAILABLE,
            'day_of_week': ScheduleSlot.MONDAY,
            'start_time_minutes': 1380,
            'end_time_minutes': 1440,
            'note': 'Поздняя тренировка',
        })

        self.assertTrue(form.is_valid(), form.errors)

    def test_rejects_end_before_or_equal_start(self):
        form = ScheduleSlotForm(data={
            'slot_type': ScheduleSlot.AVAILABLE,
            'day_of_week': ScheduleSlot.MONDAY,
            'start_time_minutes': 1080,
            'end_time_minutes': 1080,
            'note': '',
        })

        self.assertFalse(form.is_valid())
        self.assertIn('end_time_minutes', form.errors)

    def test_allows_unavailable_without_time(self):
        form = ScheduleSlotForm(data={
            'slot_type': ScheduleSlot.UNAVAILABLE,
            'day_of_week': ScheduleSlot.FRIDAY,
            'note': 'Не смогу играть',
        })

        self.assertTrue(form.is_valid(), form.errors)
        self.assertIsNone(form.cleaned_data['start_time_minutes'])
        self.assertIsNone(form.cleaned_data['end_time_minutes'])


class ScheduleAccessTests(TestCase):
    def setUp(self):
        self.player_one = Player.objects.get(name='Игрок 1')
        self.player_two = Player.objects.get(name='Игрок 2')
        self.user_one = User.objects.create_user(username='player1', password='secret-pass')
        self.user_two = User.objects.create_user(username='player2', password='secret-pass')
        self.player_one.user = self.user_one
        self.player_one.save()
        self.player_two.user = self.user_two
        self.player_two.save()

    def test_schedule_requires_login(self):
        response = self.client.get(reverse('schedule'))

        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse('login'), response.url)

    def test_player_can_create_own_slot(self):
        self.client.login(username='player1', password='secret-pass')
        response = self.client.post(reverse('slot_create'), {
            'slot_type': ScheduleSlot.AVAILABLE,
            'day_of_week': ScheduleSlot.TUESDAY,
            'start_time_minutes': 540,
            'end_time_minutes': 1080,
            'note': 'Скримы',
        })

        self.assertRedirects(response, reverse('schedule'))
        self.assertTrue(ScheduleSlot.objects.filter(player=self.player_one).exists())
        self.assertFalse(ScheduleSlot.objects.filter(player=self.player_two).exists())

    def test_player_can_create_unavailable_day(self):
        self.client.login(username='player1', password='secret-pass')
        response = self.client.post(reverse('slot_create'), {
            'slot_type': ScheduleSlot.UNAVAILABLE,
            'day_of_week': ScheduleSlot.FRIDAY,
            'note': 'Не могу в этот день',
        })

        self.assertRedirects(response, reverse('schedule'))
        slot = ScheduleSlot.objects.get(player=self.player_one, day_of_week=ScheduleSlot.FRIDAY)
        self.assertEqual(slot.slot_type, ScheduleSlot.UNAVAILABLE)
        self.assertIsNone(slot.start_time_minutes)
        self.assertIsNone(slot.end_time_minutes)

    def test_schedule_marks_unavailable_day(self):
        ScheduleSlot.objects.create(
            player=self.player_one,
            slot_type=ScheduleSlot.UNAVAILABLE,
            day_of_week=ScheduleSlot.SATURDAY,
        )
        self.client.login(username='player1', password='secret-pass')
        response = self.client.get(reverse('schedule'))

        self.assertContains(response, 'is-unavailable')
        self.assertContains(response, 'Не могу в этот день')

    def test_player_cannot_edit_another_players_slot(self):
        slot = ScheduleSlot.objects.create(
            player=self.player_two,
            day_of_week=ScheduleSlot.WEDNESDAY,
            start_time_minutes=600,
            end_time_minutes=720,
        )
        self.client.login(username='player1', password='secret-pass')
        response = self.client.post(reverse('slot_edit', args=[slot.pk]), {
            'slot_type': ScheduleSlot.AVAILABLE,
            'day_of_week': ScheduleSlot.THURSDAY,
            'start_time_minutes': 720,
            'end_time_minutes': 840,
            'note': 'Попытка изменения',
        })

        self.assertEqual(response.status_code, 404)
        slot.refresh_from_db()
        self.assertEqual(slot.player, self.player_two)
        self.assertEqual(slot.day_of_week, ScheduleSlot.WEDNESDAY)

    def test_player_cannot_edit_another_players_unavailable_slot(self):
        slot = ScheduleSlot.objects.create(
            player=self.player_two,
            slot_type=ScheduleSlot.UNAVAILABLE,
            day_of_week=ScheduleSlot.SUNDAY,
        )
        self.client.login(username='player1', password='secret-pass')
        response = self.client.post(reverse('slot_edit', args=[slot.pk]), {
            'slot_type': ScheduleSlot.AVAILABLE,
            'day_of_week': ScheduleSlot.SUNDAY,
            'start_time_minutes': 720,
            'end_time_minutes': 840,
            'note': 'Попытка изменения',
        })

        self.assertEqual(response.status_code, 404)
        slot.refresh_from_db()
        self.assertEqual(slot.slot_type, ScheduleSlot.UNAVAILABLE)
        self.assertIsNone(slot.start_time_minutes)

# Create your tests here.
