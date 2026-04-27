from django.urls import path

from . import views

urlpatterns = [
    path('', views.schedule_view, name='schedule'),
    path('slot/new/', views.slot_create, name='slot_create'),
    path('slot/<int:pk>/edit/', views.slot_edit, name='slot_edit'),
    path('slot/<int:pk>/delete/', views.slot_delete, name='slot_delete'),
]
