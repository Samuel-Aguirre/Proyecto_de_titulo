from django.db import models
from ArrendaU_app.models import Usuario

class Publicacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200, default='')
    descripcion = models.TextField()
    region = models.CharField(max_length=100, default='')
    ciudad = models.CharField(max_length=100, default='')
    direccion = models.CharField(max_length=200)
    numero_contacto = models.CharField(max_length=15)
    habitaciones_disponibles = models.PositiveIntegerField()
    #fotos = models.ManyToManyField('Foto',related_name='publicacion', blank=True)
    valor_alquiler = models.DecimalField(max_digits=10, decimal_places=0, null=False, default=0)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} - {self.descripcion[:20]}"


class Foto(models.Model):
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='fotos')
    imagen = models.ImageField(upload_to='fotos/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de {self.publicacion.titulo} - {self.fecha_creacion}"

