# chatbot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('suggestions/', views.get_location_suggestions, name='get_location_suggestions'),
]
