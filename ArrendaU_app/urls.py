from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='cerrar_sesion'),
    path('editar-perfil/', views.editar_perfil, name='editar_perfil'),
    path('cambiar-rol/', views.cambiar_rol, name='cambiar_rol'),
    path('perfil/verificar/', views.verificar_perfil, name='verificar_perfil'),
] 