from django.db import models
from django.contrib.auth import get_user_model
from django.apps import apps
import json

User = get_user_model()

class Pago(models.Model):
    ESTADOS = (
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('ANULADO', 'Anulado'),
        ('ERROR', 'Error'),
    )

    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    publicacion = models.ForeignKey(
        'ArrendaU_publicaciones_app.Publicacion',
        on_delete=models.SET_NULL,
        null=True,
        related_name='pagos'
    )
    # Campos para mantener información histórica de la publicación
    publicacion_titulo = models.CharField(max_length=255, null=True, blank=True)
    publicacion_direccion = models.CharField(max_length=255, null=True, blank=True)
    publicacion_ciudad = models.CharField(max_length=100, null=True, blank=True)
    
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    merchant_order_id = models.CharField(max_length=255, null=True, blank=True)
    preference_id = models.CharField(max_length=255, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    factura = models.FileField(upload_to='facturas/', null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, null=True, blank=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    detalles_transaccion = models.JSONField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Guardar información de la publicación antes de que pueda ser eliminada
        if self.publicacion and not self.publicacion_titulo:
            self.publicacion_titulo = self.publicacion.titulo
            self.publicacion_direccion = self.publicacion.direccion
            self.publicacion_ciudad = self.publicacion.ciudad
        super().save(*args, **kwargs)

    def __str__(self):
        titulo = self.publicacion_titulo if self.publicacion_titulo else (
            self.publicacion.titulo if self.publicacion else "Publicación eliminada"
        )
        return f"Pago {self.id} - {titulo}"

    def get_publicacion_info(self):
        """Obtener información de la publicación incluso si fue eliminada"""
        if self.publicacion:
            return {
                'titulo': self.publicacion.titulo,
                'direccion': self.publicacion.direccion,
                'ciudad': self.publicacion.ciudad
            }
        return {
            'titulo': self.publicacion_titulo or 'Publicación eliminada',
            'direccion': self.publicacion_direccion or 'No disponible',
            'ciudad': self.publicacion_ciudad or 'No disponible'
        }

    class Meta:
        ordering = ['-fecha_creacion']

    def get_detalles_transaccion(self):
        """Obtener los detalles de la transacción como diccionario"""
        return self.detalles_transaccion or {}

    def get_metodo_pago_display(self):
        """Obtener una versión más amigable del método de pago"""
        metodos = {
            # Tarjetas de crédito
            'master': 'Mastercard',
            'visa': 'Visa',
            # Tipos de pago
            'credit_card': 'Tarjeta de Crédito',
            'debit_card': 'Tarjeta de Débito',
            'account_money': 'Dinero en Cuenta MercadoPago'
        }
        
        if self.detalles_transaccion:
            metodo = self.detalles_transaccion.get('payment_method_id')
            tipo = self.detalles_transaccion.get('payment_type_id')
            
            # Para tarjetas, mostrar la marca específica
            if metodo in ['master', 'visa']:
                return f"{metodos.get(metodo)} ({metodos.get(tipo, tipo)})"
            # Para otros métodos, mostrar el tipo de pago
            elif tipo in metodos:
                return metodos.get(tipo)
        
        return 'No especificado'
