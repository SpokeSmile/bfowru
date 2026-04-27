from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Player(models.Model):
    name = models.CharField('имя игрока', max_length=80)
    avatar = models.FileField('аватар', upload_to='avatars/', blank=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        verbose_name='аккаунт',
        on_delete=models.SET_NULL,
        related_name='player_profile',
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ['id']
        verbose_name = 'игрок'
        verbose_name_plural = 'игроки'

    def __str__(self):
        return self.name

    @property
    def initial(self):
        return (self.name.strip()[:1] or '?').upper()


class ScheduleSlot(models.Model):
    AVAILABLE = 'available'
    UNAVAILABLE = 'unavailable'

    SLOT_TYPE_CHOICES = [
        (AVAILABLE, 'Диапазон времени'),
        (UNAVAILABLE, 'Не могу в этот день'),
    ]

    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

    DAY_CHOICES = [
        (MONDAY, 'Понедельник'),
        (TUESDAY, 'Вторник'),
        (WEDNESDAY, 'Среда'),
        (THURSDAY, 'Четверг'),
        (FRIDAY, 'Пятница'),
        (SATURDAY, 'Суббота'),
        (SUNDAY, 'Воскресенье'),
    ]

    player = models.ForeignKey(
        Player,
        verbose_name='игрок',
        on_delete=models.CASCADE,
        related_name='slots',
    )
    slot_type = models.CharField(
        'тип записи',
        max_length=16,
        choices=SLOT_TYPE_CHOICES,
        default=AVAILABLE,
    )
    day_of_week = models.PositiveSmallIntegerField('день недели', choices=DAY_CHOICES)
    start_time_minutes = models.PositiveSmallIntegerField('начало', blank=True, null=True)
    end_time_minutes = models.PositiveSmallIntegerField('конец', blank=True, null=True)
    note = models.CharField('комментарий', max_length=160, blank=True)
    created_at = models.DateTimeField('создано', auto_now_add=True)
    updated_at = models.DateTimeField('обновлено', auto_now=True)

    class Meta:
        ordering = ['player_id', 'day_of_week', 'start_time_minutes']
        verbose_name = 'слот расписания'
        verbose_name_plural = 'слоты расписания'
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(
                        slot_type='available',
                        start_time_minutes__isnull=False,
                        start_time_minutes__gte=0,
                        start_time_minutes__lte=1380,
                        end_time_minutes__isnull=False,
                        end_time_minutes__gte=60,
                        end_time_minutes__lte=1440,
                        end_time_minutes__gt=models.F('start_time_minutes'),
                    )
                    | Q(
                        slot_type='unavailable',
                        start_time_minutes__isnull=True,
                        end_time_minutes__isnull=True,
                    )
                ),
                name='slot_valid_by_type',
            ),
        ]

    def __str__(self):
        return f'{self.player} - {self.get_day_of_week_display()} {self.label}'

    @staticmethod
    def format_minutes(value):
        if value is None:
            return ''
        hours = value // 60
        minutes = value % 60
        return f'{hours:02d}:{minutes:02d}'

    @property
    def start_label(self):
        return self.format_minutes(self.start_time_minutes)

    @property
    def end_label(self):
        return self.format_minutes(self.end_time_minutes)

    @property
    def time_range(self):
        return f'{self.start_label}-{self.end_label}'

    @property
    def is_available(self):
        return self.slot_type == self.AVAILABLE

    @property
    def is_unavailable(self):
        return self.slot_type == self.UNAVAILABLE

    @property
    def label(self):
        if self.is_unavailable:
            return 'Не могу в этот день'
        return self.time_range

    def clean(self):
        if self.slot_type == self.UNAVAILABLE:
            self.start_time_minutes = None
            self.end_time_minutes = None
            return

        if self.start_time_minutes is None or self.end_time_minutes is None:
            raise ValidationError('Для диапазона времени нужно выбрать начало и конец.')

        if self.end_time_minutes <= self.start_time_minutes:
            raise ValidationError({'end_time_minutes': 'Время окончания должно быть позже начала.'})
