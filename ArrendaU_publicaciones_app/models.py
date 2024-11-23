from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Publicacion(models.Model):
    REGIONES_CHOICES = [
        ('araucania', 'Araucanía'),
        ('biobio', 'Bío Bío'),
        ('los_lagos', 'Los Lagos'),
        ('metropolitana', 'Metropolitana'),
        ('valparaiso', 'Valparaíso'),
        ('ohiggins', "O'Higgins"),
        ('maule', 'Maule'),
        ('nuble', 'Ñuble'),
        ('los_rios', 'Los Ríos'),
        ('arica', 'Arica y Parinacota'),
        ('tarapaca', 'Tarapacá'),
        ('antofagasta', 'Antofagasta'),
        ('atacama', 'Atacama'),
        ('coquimbo', 'Coquimbo'),
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

    def __str__(self):
        return self.titulo

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

