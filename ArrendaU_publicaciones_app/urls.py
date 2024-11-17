# publicaciones/urls.py

from django.urls import path
from ArrendaU_publicaciones_app import views

urlpatterns = [
    path('crear/', views.crear_publicacion, name='crear_publicacion'),
    path('listar/', views.listar_publicaciones, name='listar_publicaciones'),
    path('editar-publicacion/<int:publicacion_id>/', views.editar_publicacion, name='editar_publicacion'),
    path('eliminar/<int:publicacion_id>/', views.eliminar_publicacion, name='eliminar_publicacion'),
    path('eliminar-foto/<int:foto_id>/', views.eliminar_foto, name='eliminar_foto'),
]