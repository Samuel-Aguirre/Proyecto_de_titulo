# publicaciones/urls.py

from django.urls import path
from . import views

app_name = 'ArrendaU_publicaciones_app'

urlpatterns = [
    path('publicacion/<int:pk>/eliminar/', views.eliminar_publicacion, name='eliminar_publicacion'),
    path('publicacion/nueva/', views.crear_publicacion, name='crear_publicacion'),
    path('publicacion/<int:publicacion_id>/editar/', views.editar_publicacion, name='editar_publicacion'),
    path('publicacion/listar/', views.listar_publicaciones, name='listar_publicaciones'),
    path('eliminar-foto/<int:foto_id>/', views.eliminar_foto, name='eliminar_foto'),
]