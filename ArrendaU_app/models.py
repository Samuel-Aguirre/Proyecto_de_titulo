from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Usuario(AbstractUser):
    ROLES = [
        ('Arrendador', 'Arrendador'),
        ('Arrendatario', 'Arrendatario'),
    ]
    
    rol = models.CharField(max_length=20, choices=ROLES)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class PerfilArrendatario(models.Model):
    OPCIONES_BEBEDOR = [
        ('', 'Seleccione una opción'),
        ('si', 'Sí'),
        ('casual', 'Casual'), 
        ('no', 'No')
    ]
    
    OPCIONES_FUMADOR = [
        ('', 'Seleccione una opción'),
        ('si', 'Sí'),
        ('ocasional', 'Ocasional'),
        ('no', 'No')
    ]
    
    OPCIONES_MASCOTA = [
        ('', 'Seleccione una opción'),
        ('tengo', 'Ya tengo'),
        ('planeo', 'Planeo tener'),
        ('no', 'No')
    ]

    usuario = models.OneToOneField('Usuario', on_delete=models.CASCADE)
    descripcion = models.TextField(max_length=500, blank=True)
    universidad = models.CharField(max_length=100)
    carrera = models.CharField(max_length=100)
    documento_estudiante = models.FileField(
        upload_to='documentos_estudiante/', 
        blank=True,
        help_text='Certificado de alumno regular o matrícula'
    )
    bebedor = models.CharField(max_length=10, choices=OPCIONES_BEBEDOR)
    fumador = models.CharField(max_length=10, choices=OPCIONES_FUMADOR)
    mascota = models.CharField(max_length=10, choices=OPCIONES_MASCOTA)
    tipo_mascota = models.CharField(max_length=50, blank=True)
    nivel_ruido = models.IntegerField(
        choices=[
            (0, 'Seleccione una opción'),
            (1, 'Muy silencioso'),
            (2, 'Normal'),
            (3, 'Ruidoso')
        ],
        default=0
    )
    horario_llegada = models.TimeField(null=True, blank=True)
    presupuesto_max = models.IntegerField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.usuario.nombre}"

class PerfilArrendador(models.Model):
    PREFERENCIAS_CHOICES = [
        (0, 'Seleccione una opción'),
        (3, 'No permitido'),
        (2, 'Prefiero que no'),
        (1, 'Me es indiferente')
    ]

    VERIFICACION_CHOICES = [
        (0, 'Seleccione una opción'),
        (3, 'Es obligatorio'),
        (2, 'Es preferible'),
        (1, 'No es necesario')
    ]

    RUIDO_CHOICES = [
        (0, 'Seleccione una opción'),
        (3, 'Debe ser muy silencioso'),
        (2, 'Ruido moderado aceptable'),
        (1, 'Sin restricciones de ruido')
    ]

    usuario = models.OneToOneField('Usuario', on_delete=models.CASCADE)
    descripcion = models.TextField(max_length=500, blank=True)
    pref_no_fumador = models.IntegerField(choices=PREFERENCIAS_CHOICES, default=1)
    pref_no_bebedor = models.IntegerField(choices=PREFERENCIAS_CHOICES, default=1)
    pref_no_mascotas = models.IntegerField(choices=PREFERENCIAS_CHOICES, default=1)
    pref_estudiante_verificado = models.IntegerField(choices=VERIFICACION_CHOICES, default=1)
    pref_nivel_ruido = models.IntegerField(choices=RUIDO_CHOICES, default=1)
    horario_visitas = models.CharField(max_length=200, blank=True)
    reglas_casa = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferencias de {self.usuario.nombre}"

class Compatibilidad(models.Model):
    arrendatario = models.ForeignKey(PerfilArrendatario, on_delete=models.CASCADE)
    arrendador = models.ForeignKey(PerfilArrendador, on_delete=models.CASCADE)
    publicacion = models.ForeignKey('ArrendaU_publicaciones_app.Publicacion', on_delete=models.CASCADE)
    porcentaje = models.FloatField()
    descripcion = models.TextField(blank=True, null=True)
    fecha_calculo = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['arrendatario', 'publicacion']

    def __str__(self):
        return f"Compatibilidad: {self.arrendatario.usuario.nombre} - {self.publicacion.titulo}"
