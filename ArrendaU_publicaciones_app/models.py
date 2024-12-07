from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import capfirst
from unidecode import unidecode

User = get_user_model()

class Publicacion(models.Model):
    REGIONES_CHOICES = [
        ('arica', 'Arica y Parinacota'),
        ('tarapaca', 'Tarapacá'),
        ('antofagasta', 'Antofagasta'),
        ('atacama', 'Atacama'),
        ('coquimbo', 'Coquimbo'),
        ('valparaiso', 'Valparaíso'),
        ('metropolitana', 'Metropolitana'),
        ('ohiggins', "O'Higgins"),
        ('maule', 'Maule'),
        ('nuble', 'Ñuble'),
        ('biobio', 'Bío Bío'),
        ('araucania', 'Araucanía'),
        ('los_rios', 'Los Ríos'),
        ('los_lagos', 'Los Lagos'),
        ('aysen', 'Aysén'),
        ('magallanes', 'Magallanes'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    region = models.CharField(max_length=50, choices=REGIONES_CHOICES)
    ciudad = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200)
    numero_contacto = models.CharField(max_length=20)
    habitaciones_disponibles = models.IntegerField()
    valor_alquiler = models.IntegerField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activa = models.BooleanField(default=True)
    vistas = models.IntegerField(default=0)
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('PENDIENTE_PAGO', 'Pendiente de Pago'),
        ('PUBLICADA', 'Publicada'),
        ('INACTIVA', 'Inactiva')
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR'
    )

    @property
    def estado_publicacion(self):
        """Retorna el estado actual de la publicación basado en el último pago activo"""
        try:
            # Buscar el último pago que esté APROBADO o PENDIENTE
            ultimo_pago = self.pagos.filter(
                estado__in=['APROBADO', 'PENDIENTE']
            ).order_by('-fecha_creacion').first()
            
            if ultimo_pago:
                if ultimo_pago.estado == 'APROBADO':
                    return 'Publicada' if self.estado == 'PUBLICADA' else 'Inactiva'
                return f'Pago {ultimo_pago.get_estado_display()}'
            
            return 'Pendiente de Pago'
            
        except Exception as e:
            print(f"Error al obtener estado de publicación: {e}")
            return 'Pendiente de Pago'

    def __str__(self):
        return f"{self.titulo} ({self.estado_publicacion})"

    def incrementar_vistas(self):
        self.vistas += 1
        self.save()

    def obtener_estadisticas(self):
        total_postulaciones = RespuestaArrendatario.objects.filter(
            formulario__publicacion=self
        ).count()
        
        tasa_conversion = 0
        if self.vistas > 0:
            tasa_conversion = (total_postulaciones / self.vistas) * 100

        return {
            'vistas': self.vistas,
            'postulaciones': total_postulaciones,
            'tasa_conversion': round(tasa_conversion, 1)
        }

    def clean(self):
        super().clean()
        if self.ciudad:
            # Eliminar acentos y convertir a minúsculas
            ciudad_limpia = unidecode(self.ciudad.lower())
            # Capitalizar primera letra
            self.ciudad = capfirst(ciudad_limpia)

    def save(self, *args, **kwargs):
        # Formatear ciudad antes de guardar
        if self.ciudad:
            # Eliminar acentos y convertir a minúsculas
            ciudad_limpia = unidecode(self.ciudad.lower())
            # Capitalizar primera letra
            self.ciudad = capfirst(ciudad_limpia)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Asegurarse de que cualquier pago asociado se elimine primero
        try:
            if hasattr(self, 'pago'):
                self.pago.delete()
        except Exception as e:
            print(f"Error al eliminar pago asociado: {e}")
        super().delete(*args, **kwargs)

class FormularioCompatibilidad(models.Model):
    publicacion = models.OneToOneField(Publicacion, on_delete=models.CASCADE, related_name='formulario')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Formulario de {self.publicacion.titulo}"

class PreguntaFormulario(models.Model):
    formulario = models.ForeignKey(FormularioCompatibilidad, on_delete=models.CASCADE, related_name='preguntas')
    texto_pregunta = models.CharField(max_length=500)
    respuesta_esperada = models.CharField(max_length=200)
    orden = models.IntegerField(default=0)

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return self.texto_pregunta

class OpcionRespuesta(models.Model):
    pregunta = models.ForeignKey(PreguntaFormulario, on_delete=models.CASCADE, related_name='opciones')
    texto_opcion = models.CharField(max_length=200)
    orden = models.IntegerField(default=0)

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return self.texto_opcion

class Foto(models.Model):
    publicacion = models.ForeignKey(Publicacion, related_name='fotos', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='publicaciones/', null=True, blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.publicacion.titulo}"

class RespuestaArrendatario(models.Model):
    ESTADOS = (
        ('PENDIENTE', 'Pendiente'),
        ('ACEPTADO', 'Aceptado'),
        ('RECHAZADO', 'Rechazado'),
    )
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    formulario = models.ForeignKey(FormularioCompatibilidad, on_delete=models.CASCADE, related_name='respuestas_arrendatarios')
    fecha_respuesta = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')

    def __str__(self):
        return f"Respuesta de {self.usuario.username} para {self.formulario.publicacion.titulo}"

class RespuestaPregunta(models.Model):
    respuesta_arrendatario = models.ForeignKey(RespuestaArrendatario, on_delete=models.CASCADE, related_name='respuestas')
    pregunta = models.ForeignKey(PreguntaFormulario, on_delete=models.CASCADE)
    respuesta_seleccionada = models.CharField(max_length=200)

    def __str__(self):
        return f"Respuesta a {self.pregunta.texto_pregunta}: {self.respuesta_seleccionada}"

class PublicacionGuardada(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='publicaciones_guardadas')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='guardada_por')
    fecha_guardado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'publicacion')  # Evita duplicados
        ordering = ['-fecha_guardado']

    def __str__(self):
        return f"{self.usuario.username} guardó {self.publicacion.titulo}"

class Notificacion(models.Model):
    TIPOS = (
        ('PENDIENTE', 'Nueva Postulación'),
        ('ACEPTADO', 'Postulación Aceptada'),
        ('RECHAZADO', 'Postulación Rechazada'),
    )
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Notificación para {self.usuario.username}: {self.tipo}"

