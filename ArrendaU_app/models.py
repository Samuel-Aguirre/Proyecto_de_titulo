from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class Usuario(AbstractUser):
    ROLES = [
        ('Arrendador', 'Arrendador'),
        ('Arrendatario', 'Arrendatario'),
    ]
    
    rol = models.CharField(max_length=20, choices=ROLES)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    segundo_apellido = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    
    # Campos adicionales
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(
        max_length=20,
        choices=[
            ('M', 'Masculino'),
            ('F', 'Femenino'),
            ('O', 'Otro'),
            ('N', 'Prefiero no decirlo')
        ],
        blank=True,
        null=True
    )
    
    # Campos para verificación OTP
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    
    def __str__(self):
        nombre_completo = f"{self.nombre} {self.apellido}"
        if self.segundo_apellido:
            nombre_completo += f" {self.segundo_apellido}"
        return nombre_completo

    def verificar_otp(self, codigo):
        """Verifica si el código OTP es válido"""
        if not self.otp_code or not self.otp_expiry:
            return False
            
        if timezone.now() > self.otp_expiry:
            # Código expirado
            self.otp_code = None
            self.otp_expiry = None
            self.save()
            return False
            
        if str(self.otp_code) == str(codigo):
            # Código válido
            self.email_verified = True
            self.otp_code = None
            self.otp_expiry = None
            self.save()
            return True
            
        return False

    @property
    def promedio_resenas(self):
        resenas = self.resenas_recibidas.all()
        if not resenas:
            return 0
        return round(sum(r.puntuacion for r in resenas) / resenas.count(), 1)

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
    presupuesto_max = models.CharField(
        max_length=20, 
        null=True, 
        blank=True,
        help_text='Presupuesto máximo con formato (ej: 250.000)'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    telefono = models.CharField(max_length=20, help_text='Número de teléfono de contacto')

    def __str__(self):
        return f"Perfil de {self.usuario.nombre}"

    def clean_telefono(self):
        """Limpia y formatea el número de teléfono antes de guardarlo"""
        if self.telefono:
            # Eliminar todos los caracteres excepto números y +
            numero = ''.join(c for c in self.telefono if c.isdigit() or c == '+')
            
            # Asegurarse que comience con +56
            if not numero.startswith('+'):
                if numero.startswith('56'):
                    numero = '+' + numero
                else:
                    numero = '+56' + numero
            
            # Formatear como: +56 9 XXXX XXXX
            if len(numero) >= 12:
                self.telefono = f"{numero[:3]} {numero[3:4]} {numero[4:8]} {numero[8:12]}"
    
    def save(self, *args, **kwargs):
        self.clean_telefono()
        super().save(*args, **kwargs)

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
    publicacion = models.ForeignKey('ArrendaU_publicaciones_app.Publicacion', on_delete=models.CASCADE)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    descripcion = models.CharField(max_length=200)
    fecha_calculo = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['arrendatario', 'publicacion']

    def __str__(self):
        return f"Compatibilidad: {self.arrendatario.usuario.nombre} - {self.publicacion.titulo}"

class Resena(models.Model):
    TIPO_CHOICES = [
        ('ARRENDADOR_A_ARRENDATARIO', 'Arrendador a Arrendatario'),
        ('ARRENDATARIO_A_ARRENDADOR', 'Arrendatario a Arrendador')
    ]

    autor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='resenas_escritas')
    usuario_resenado = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='resenas_recibidas')
    tipo_resena = models.CharField(max_length=50, choices=TIPO_CHOICES)
    puntuacion = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    publicacion = models.ForeignKey('ArrendaU_publicaciones_app.Publicacion', 
                                  on_delete=models.SET_NULL, 
                                  null=True, 
                                  blank=True)

    class Meta:
        unique_together = ['autor', 'usuario_resenado', 'publicacion']

class Interaccion(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('FINALIZADO', 'Finalizado'),
        ('EXPULSADO', 'Expulsado')
    ]

    arrendador = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='interacciones_como_arrendador')
    arrendatario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='interacciones_como_arrendatario')
    publicacion = models.ForeignKey('ArrendaU_publicaciones_app.Publicacion', on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['arrendador', 'arrendatario', 'publicacion']

    def __str__(self):
        return f"Interacción: {self.arrendador.nombre} - {self.arrendatario.nombre} ({self.publicacion.titulo})"
