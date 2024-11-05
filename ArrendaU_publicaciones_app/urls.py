# publicaciones/urls.py

from django.urls import path
from ArrendaU_publicaciones_app import views

urlpatterns = [
    path('crear/', views.crear_publicacion, name='crear_publicacion'),
    path('listar/', views.listar_publicaciones, name='listar_publicaciones'),
]
