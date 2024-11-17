from django.urls import path
from . import views

urlpatterns = [
    # ... tus otras URLs ...
    path('cerrar_sesion/', views.logout_view, name='cerrar_sesion'),
] 