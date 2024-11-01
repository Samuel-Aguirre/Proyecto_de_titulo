from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, apellido, rol, password=None):
        if not email:
            raise ValueError("El usuario debe tener un correo electrónico")
        if not rol:
            raise ValueError("El usuario debe tener un rol")
        
        email = self.normalize_email(email)
        user = self.model(email=email, nombre=nombre, apellido=apellido, rol=rol, fecha_creacion=timezone.now())
        user.set_password(password)
        user.save(using=self._db)
        return user

class Usuario(AbstractBaseUser):
    ROLES = (
        ('Arrendador', 'Arrendador'),
        ('Arrendatario', 'Arrendatario'),
    )
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=30)
    apellido = models.CharField(max_length=30)
    rol = models.CharField(max_length=15, choices=ROLES)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    ultimo_login = models.DateTimeField(blank=True, null=True)

    is_active = models.BooleanField(default=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido', 'rol']

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.rol}"
