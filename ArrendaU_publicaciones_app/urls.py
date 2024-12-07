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
    path('publicacion/<int:publicacion_id>/detalle/', views.detalle_publicacion, name='detalle_publicacion'),
    path('postulacion/<int:postulacion_id>/aceptar/', views.aceptar_postulacion, name='aceptar_postulacion'),
    path('postulacion/<int:postulacion_id>/rechazar/', views.rechazar_postulacion, name='rechazar_postulacion'),
    path('notificaciones/', views.obtener_notificaciones, name='obtener_notificaciones'),
    path('notificacion/<int:notificacion_id>/marcar-leida/', views.marcar_notificacion_leida, name='marcar_notificacion_leida'),
    path('postulacion/<int:postulacion_id>/cancelar/', views.cancelar_gestion_postulacion, name='cancelar_gestion_postulacion'),
    path('perfil/<int:user_id>/info/', views.obtener_info_perfil, name='obtener_info_perfil'),
    path('publicacion/<int:publicacion_id>/vista/', views.registrar_vista, name='registrar_vista'),
    path('postulacion/<int:postulacion_id>/respuestas/', views.obtener_respuestas_postulacion, name='obtener_respuestas_postulacion'),
    path('actualizar-perfil/', views.actualizar_perfil, name='actualizar_perfil'),
    path('publicacion/<int:publicacion_id>/postular-directo/', views.postular_directo, name='postular_directo'),
    path('pagos/historial/', views.historial_pagos, name='historial_pagos'),
    path('borrador/<int:pk>/eliminar/', views.eliminar_borrador, name='eliminar_borrador'),
]