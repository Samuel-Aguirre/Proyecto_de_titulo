from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from ArrendaU.forms import LoginForm, RegisterForm
from .models import Usuario, Resena, Interaccion
from ArrendaU_publicaciones_app.models import Publicacion
from django.utils import timezone
from .models import PerfilArrendatario, PerfilArrendador
from .forms import PerfilArrendatarioForm, PerfilArrendadorForm
import os
from django.http import JsonResponse
from .utils import enviar_otp_email
from django.core.exceptions import ValidationError
import json
from django.db.models import Q

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user:
                login(request, user)
                return redirect('dashboard')
            else:
                form.add_error(None, "Credenciales incorrectas")
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            try:
                # No guardamos el usuario todavía
                user = form.save(commit=False)
                
                # Enviamos el código OTP
                otp_result = enviar_otp_email(user.email, user.nombre)
                
                if otp_result['success']:
                    # Guardamos el código OTP y su fecha de expiración
                    user.otp_code = otp_result['codigo_otp']
                    user.otp_expiry = otp_result['fecha_expiracion']
                    user.save()
                    
                    # Guardamos los datos del formulario en la sesión
                    request.session['pending_user_id'] = user.id
                    
                    messages.success(
                        request, 
                        "Te hemos enviado un código de verificación a tu correo electrónico.",
                        extra_tags='alert-success'
                    )
                    return redirect('verify_otp')
                else:
                    messages.error(
                        request,
                        f"Error al enviar el código de verificación: {otp_result['error']}",
                        extra_tags='alert-error'
                    )
            except Exception as e:
                messages.error(
                    request,
                    f"Error durante el registro: {str(e)}",
                    extra_tags='alert-error'
                )
        else:
            messages.error(
                request,
                "Por favor corrige los errores en el formulario.",
                extra_tags='alert-error'
            )
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})

def verify_otp(request):
    user_id = request.session.get('pending_user_id')
    if not user_id:
        messages.error(request, "Sesión inválida. Por favor, regístrate nuevamente.")
        return redirect('register')
    
    if request.method == 'POST':
        codigo = request.POST.get('otp_code')
        try:
            user = Usuario.objects.get(id=user_id)
            if user.verificar_otp(codigo):
                # Limpiamos la sesión
                del request.session['pending_user_id']
                
                messages.success(
                    request,
                    "¡Correo verificado! Ya puedes iniciar sesión.",
                    extra_tags='alert-success'
                )
                return redirect('login')
            else:
                messages.error(
                    request,
                    "Código inválido o expirado. Por favor, intenta nuevamente.",
                    extra_tags='alert-error'
                )
        except Usuario.DoesNotExist:
            messages.error(request, "Usuario no encontrado.")
            return redirect('register')
        
    return render(request, 'verify_otp.html')

def resend_otp(request):
    user_id = request.session.get('pending_user_id')
    if not user_id:
        messages.error(request, "Sesión inválida. Por favor, regístrate nuevamente.")
        return redirect('register')
    
    try:
        user = Usuario.objects.get(id=user_id)
        # Enviamos nuevo código OTP
        otp_result = enviar_otp_email(user.email, user.nombre)
        
        if otp_result['success']:
            # Actualizamos el código OTP y su fecha de expiración
            user.otp_code = otp_result['codigo_otp']
            user.otp_expiry = otp_result['fecha_expiracion']
            user.save()
            
            messages.success(
                request, 
                "Te hemos enviado un nuevo código de verificaci��n.",
                extra_tags='alert-success'
            )
        else:
            messages.error(
                request,
                f"Error al enviar el código: {otp_result['error']}",
                extra_tags='alert-error'
            )
            
    except Usuario.DoesNotExist:
        messages.error(request, "Usuario no encontrado.")
        return redirect('register')
        
    return redirect('verify_otp')

@login_required
def dashboard_arrendador(request):
    return render(request, 'arrendador_home.html')

@login_required
def dashboard_arrendatario(request):
    return render(request, 'arrendatario_home.html')

def home(request):
    # Si el usuario está logueado, redirigir al dashboard
    if request.user.is_authenticated:
        return redirect('dashboard')
    # Si no está logueado, mostrar la página de inicio
    return render(request, 'home.html')

def dashboard_view(request):
    # Obtener todas las publicaciones
    publicaciones = Publicacion.objects.all().prefetch_related(
        'fotos',
        'usuario__perfilarrendador'
    )
    
    # Obtener ciudades únicas agrupadas por región
    ciudades_por_region = {}
    for publicacion in publicaciones:
        region = publicacion.get_region_display()  # Obtiene el nombre legible de la región
        ciudad = publicacion.ciudad
        if region not in ciudades_por_region:
            ciudades_por_region[region] = set()
        ciudades_por_region[region].add(ciudad)
    
    # Ordenar las regiones y ciudades
    ciudades_por_region = {
        region: sorted(list(ciudades))
        for region, ciudades in sorted(ciudades_por_region.items())
    }
    
    # Si el usuario está autenticado, agregar información adicional
    if request.user.is_authenticated:
        if request.user.rol == 'Arrendador':
            publicaciones = publicaciones.filter(usuario=request.user)
        else:
            for publicacion in publicaciones:
                publicacion.esta_guardada = publicacion.guardada_por.filter(usuario=request.user).exists()
    
    return render(request, 'dashboard.html', {
        'publicaciones': publicaciones,
        'ciudades_por_region': ciudades_por_region,
        'user': request.user
    })

def logout_view(request):
    logout(request)
    return redirect('home')

@login_required
def editar_perfil(request):
    if request.user.rol == 'Arrendador':
        perfil, created = PerfilArrendador.objects.get_or_create(usuario=request.user)
        form_class = PerfilArrendadorForm
    else:
        perfil, created = PerfilArrendatario.objects.get_or_create(
            usuario=request.user,
            defaults={'presupuesto_max': 0}
        )
        form_class = PerfilArrendatarioForm

    if request.method == 'POST':
        form = form_class(request.POST, request.FILES, instance=perfil)
        if form.is_valid():
            perfil = form.save(commit=False)
            
            # Manejar la eliminación del documento solo para arrendatarios
            if request.user.rol == 'Arrendatario':
                if request.POST.get('documento_eliminado') == 'true':
                    if perfil.documento_estudiante:
                        try:
                            ruta_archivo = perfil.documento_estudiante.path
                            perfil.documento_estudiante = None
                            if os.path.exists(ruta_archivo):
                                os.remove(ruta_archivo)
                        except Exception as e:
                            print(f"Error al eliminar el documento: {e}")

                # Manejar el campo de mascota solo para arrendatarios
                if perfil.mascota == 'no':
                    perfil.tipo_mascota = ''
            
            perfil.save()
            messages.success(request, 'Perfil actualizado exitosamente')
            return redirect('dashboard')
    else:
        form = form_class(instance=perfil)

    return render(request, 'perfil_form.html', {
        'form': form,
        'is_arrendador': request.user.rol == 'Arrendador'
    })

@login_required
def ver_perfil(request, user_id=None):
    if user_id is None:
        user_id = request.user.id
    
    usuario = get_object_or_404(User, id=user_id)
    
    if usuario.rol == 'Arrendador':
        perfil = get_object_or_404(PerfilArrendador, usuario=usuario)
        template = 'perfil_arrendador.html'
    else:
        perfil = get_object_or_404(PerfilArrendatario, usuario=usuario)
        template = 'perfil_arrendatario.html'
    
    return render(request, template, {
        'perfil': perfil,
        'es_propio': request.user == usuario
    })

@login_required
def cambiar_rol(request):
    if request.user.rol == 'Arrendador':
        request.user.rol = 'Arrendatario'
        messages.success(request, 'Tu rol ha sido cambiado a Arrendatario')
    else:
        request.user.rol = 'Arrendador'
        messages.success(request, 'Tu rol ha sido cambiado a Arrendador')
    request.user.save()
    return redirect('dashboard')

@login_required
def verificar_perfil(request):
    try:
        if request.user.rol == 'Arrendador':
            perfil = request.user.perfilarrendador
            campos_requeridos = [
                perfil.pref_no_fumador,
                perfil.pref_no_bebedor,
                perfil.pref_no_mascotas,
                perfil.pref_estudiante_verificado,
                perfil.pref_nivel_ruido,
                perfil.horario_visitas,
                perfil.reglas_casa,
                perfil.descripcion
            ]
        else:  # Arrendatario
            perfil = request.user.perfilarrendatario
            campos_requeridos = [
                perfil.universidad,
                perfil.carrera,
                perfil.bebedor,
                perfil.fumador,
                perfil.mascota,
                perfil.nivel_ruido,
                perfil.horario_llegada,
                perfil.presupuesto_max,
                perfil.descripcion
            ]
        
        perfil_completo = all(campo for campo in campos_requeridos)
        
        return JsonResponse({
            'success': True,
            'perfil_completo': perfil_completo,
            'mensaje': 'Perfil verificado correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'perfil_completo': False,
            'mensaje': f'Error al verificar el perfil: {str(e)}'
        })

@login_required
def configuracion_view(request):
    if request.method == 'POST':
        try:
            accion = request.POST.get('accion')
            
            if accion == 'actualizar_personal':
                # Actualizar información personal
                request.user.nombre = request.POST.get('nombre')
                request.user.apellido = request.POST.get('apellido')
                request.user.segundo_apellido = request.POST.get('segundo_apellido', '')
                request.user.email = request.POST.get('email')
                request.user.telefono_contacto = request.POST.get('telefono_contacto')
                request.user.fecha_nacimiento = request.POST.get('fecha_nacimiento') or None
                request.user.genero = request.POST.get('genero')
                request.user.save()
                
                # No enviamos mensajes si es una petición AJAX
                if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    messages.success(request, 'Información personal actualizada correctamente')
                
                return JsonResponse({
                    'success': True,
                    'message': 'Información personal actualizada correctamente'
                })
                
            elif accion == 'cambiar_password':
                # Verificar contraseña actual
                if not request.user.check_password(request.POST.get('current_password')):
                    return JsonResponse({
                        'success': False,
                        'message': 'La contraseña actual es incorrecta'
                    })
                
                # Cambiar contraseña
                request.user.set_password(request.POST.get('new_password'))
                request.user.save()
                
                # No enviamos mensajes si es una petición AJAX
                if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    messages.success(request, 'Contraseña actualizada correctamente')
                
                return JsonResponse({
                    'success': True,
                    'message': 'Contraseña actualizada correctamente'
                })
                
            elif accion == 'eliminar_cuenta':
                # Eliminar cuenta de usuario
                request.user.delete()
                logout(request)
                
                # No enviamos mensajes si es una petición AJAX
                if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    messages.success(request, 'Cuenta eliminada correctamente')
                
                return JsonResponse({
                    'success': True,
                    'message': 'Cuenta eliminada correctamente',
                    'redirect': '/'
                })
                
        except Exception as e:
            if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                messages.error(request, f'Error: {str(e)}')
            return JsonResponse({
                'success': False,
                'message': f'Error: {str(e)}'
            })
            
    return render(request, 'configuracion.html')

@login_required
def crear_resena(request, usuario_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            usuario_resenado = get_object_or_404(Usuario, id=usuario_id)
            publicacion_id = data.get('publicacion_id')
            
            # Validar datos requeridos
            if not all([data.get('puntuacion'), data.get('comentario')]):
                return JsonResponse({
                    'success': False,
                    'error': 'La puntuación y el comentario son obligatorios'
                }, status=400)

            # Verificar si ya existe una reseña
            resena_existente = Resena.objects.filter(
                autor=request.user,
                usuario_resenado=usuario_resenado,
                publicacion_id=publicacion_id
            ).exists()
            
            if resena_existente:
                return JsonResponse({
                    'success': False,
                    'error': 'Ya has dejado una reseña para este usuario en esta publicación'
                }, status=400)
            
            # Verificar que existe una interacción válida
            interaccion = Interaccion.objects.filter(
                Q(arrendador=request.user, arrendatario=usuario_resenado) |
                Q(arrendador=usuario_resenado, arrendatario=request.user),
                estado__in=['FINALIZADO', 'EXPULSADO']
            ).exists()
            
            if not interaccion:
                return JsonResponse({
                    'success': False,
                    'error': 'No puedes dejar una reseña sin haber tenido una interacción válida'
                }, status=403)
            
            # Determinar el tipo de reseña
            tipo_resena = 'ARRENDADOR_A_ARRENDATARIO' if request.user.rol == 'Arrendador' else 'ARRENDATARIO_A_ARRENDADOR'
            
            # Crear la reseña
            resena = Resena.objects.create(
                autor=request.user,
                usuario_resenado=usuario_resenado,
                tipo_resena=tipo_resena,
                puntuacion=int(data['puntuacion']),
                comentario=data['comentario'],
                publicacion_id=publicacion_id
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Reseña creada exitosamente'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Datos inválidos'
            }, status=400)
        except Exception as e:
            print(f"Error al crear reseña: {str(e)}")  # Para debugging
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    }, status=405)

@login_required
def mis_resenas_recibidas(request):
    resenas = Resena.objects.filter(usuario_resenado=request.user).select_related(
        'autor', 'publicacion'
    ).order_by('-fecha_creacion')
    
    # Si es arrendatario, buscar interacciones pendientes de reseñar
    interacciones_pendientes = None
    if request.user.rol == 'Arrendatario':
        # Obtener interacciones donde el usuario es arrendatario y no ha dejado reseña
        interacciones_pendientes = Interaccion.objects.filter(
            arrendatario=request.user,
            estado__in=['FINALIZADO', 'EXPULSADO']
        ).exclude(
            publicacion__in=Resena.objects.filter(
                autor=request.user,
                tipo_resena='ARRENDATARIO_A_ARRENDADOR'
            ).values_list('publicacion', flat=True)
        ).select_related('arrendador', 'publicacion')
    
    print(f"Interacciones pendientes: {interacciones_pendientes.count() if interacciones_pendientes else 0}")  # Debug
    
    return render(request, 'mis_resenas.html', {
        'resenas': resenas,
        'tipo': 'recibidas',
        'interacciones_pendientes': interacciones_pendientes
    })

@login_required
def mis_resenas_escritas(request):
    resenas = Resena.objects.filter(autor=request.user).select_related(
        'usuario_resenado', 'publicacion'
    ).order_by('-fecha_creacion')
    
    return render(request, 'mis_resenas.html', {
        'resenas': resenas,
        'tipo': 'escritas'
    })
