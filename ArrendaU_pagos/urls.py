from django.urls import path
from . import views

app_name = 'pagos'

urlpatterns = [
    path('iniciar/<int:publicacion_id>/', views.iniciar_pago, name='iniciar_pago'),
    path('exitoso/', views.pago_exitoso, name='pago_exitoso'),
    path('fallido/', views.pago_fallido, name='pago_fallido'),
    path('pendiente/', views.pago_pendiente, name='pago_pendiente'),
    path('webhook/', views.webhook, name='webhook'),
    path('<int:pago_id>/detalles/', views.detalles_pago, name='detalles_pago'),
    path('<int:pago_id>/comprobante/', views.generar_comprobante, name='generar_comprobante'),
] 