from django.db import models
from ArrendaU_app.models import Usuario

# Create your models here.
class Publicacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    descripcion = models.TextField()
    direccion = models.CharField(max_length=255)
    numero_contacto = models.CharField(max_length=20)
    habitaciones_disponibles = models.IntegerField()
    fotos = models.ImageField(upload_to='fotos/', blank=True)  # Para una galería, podrías usar otra estrategia
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} - {self.descripcion[:20]}"