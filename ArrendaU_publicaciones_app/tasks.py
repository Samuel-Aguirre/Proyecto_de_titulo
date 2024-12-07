from django.utils import timezone
from datetime import timedelta

def limpiar_publicaciones_pendientes():
    limite_tiempo = timezone.now() - timedelta(days=7)
    Publicacion.objects.filter(
        estado='PENDIENTE_PAGO',
        fecha_creacion__lt=limite_tiempo
    ).delete()