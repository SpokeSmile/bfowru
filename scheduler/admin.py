from django.contrib import admin

from .models import Player, ScheduleSlot


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'avatar')
    search_fields = ('name', 'user__username')


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = ('player', 'slot_type', 'day_of_week', 'start_label', 'end_label', 'note')
    list_filter = ('player', 'slot_type', 'day_of_week')
    search_fields = ('player__name', 'note')
