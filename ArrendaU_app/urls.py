from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('cerrar_sesion/', views.logout_view, name='cerrar_sesion'),
    path('perfil/editar/', views.editar_perfil, name='editar_perfil'),
    path('perfil/<int:user_id>/', views.ver_perfil, name='ver_perfil'),
] 