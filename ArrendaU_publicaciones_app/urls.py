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
    path('filtrar/', views.filtrar_publicaciones, name='filtrar_publicaciones'),
    path('obtener-fotos/<int:publicacion_id>/', views.obtener_fotos_publicacion, name='obtener_fotos'),
    path('publicacion/<int:publicacion_id>/formulario/', views.obtener_formulario, name='obtener_formulario'),
    path('publicacion/<int:publicacion_id>/responder/', views.responder_formulario, name='responder_formulario'),
    path('mis-postulaciones/', views.mis_postulaciones, name='mis_postulaciones'),
    path('postulacion/<int:postulacion_id>/eliminar/', views.eliminar_postulacion, name='eliminar_postulacion'),
    path('publicaciones-guardadas/', views.publicaciones_guardadas, name='publicaciones_guardadas'),
    path('publicacion/<int:publicacion_id>/toggle-guardado/', views.toggle_guardado, name='toggle_guardado'),
]