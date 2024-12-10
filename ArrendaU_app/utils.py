from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import pyotp
import random
import string

def generar_codigo_otp():
    """Genera un código OTP de 6 dígitos"""
    return ''.join(random.choices(string.digits, k=6))

def enviar_otp_email(email, nombre):
    """Envía un código OTP por correo electrónico"""
    try:
        # Si la verificación OTP está desactivada, retornar éxito sin enviar
        if not settings.ENABLE_EMAIL_OTP:
            return {
                'success': True,
                'codigo_otp': '123456',  # Código de prueba
                'fecha_expiracion': timezone.now() + timezone.timedelta(minutes=settings.OTP_EXPIRY_TIME)
            }

        # Generar código OTP
        codigo_otp = generar_codigo_otp()
        
        # Preparar el contenido del correo
        context = {
            'nombre': nombre,
            'codigo_otp': codigo_otp,
            'expiracion_minutos': settings.OTP_EXPIRY_TIME
        }
        
        # Renderizar las versiones HTML y texto plano del correo
        html_message = render_to_string('emails/otp_email.html', context)
        plain_message = render_to_string('emails/otp_email.txt', context)
        
        # Enviar el correo
        send_mail(
            subject='Código de verificación ArrendaU',
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            html_message=html_message
        )
        
        # Calcular fecha de expiración
        fecha_expiracion = timezone.now() + timezone.timedelta(minutes=settings.OTP_EXPIRY_TIME)
        
        return {
            'success': True,
            'codigo_otp': codigo_otp,
            'fecha_expiracion': fecha_expiracion
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        } 