from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from ArrendaU.forms import LoginForm, RegisterForm
from .models import Usuario
from ArrendaU_publicaciones_app.models import Publicacion
from django.utils import timezone
from .models import PerfilArrendatario, PerfilArrendador
from .forms import PerfilArrendatarioForm, PerfilArrendadorForm
import os
from django.http import JsonResponse

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
                messages.error(request, "Credenciales incorrectas", extra_tags='alert-error')
        else:
            messages.error(request, "Por favor corrige los errores en el formulario.", extra_tags='alert-error')
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Usuario registrado correctamente", extra_tags='alert-success')
            return render(request, 'register.html', {
                'form': form,
                'redirect_to_login': True
            })
        else:
            messages.error(request, "Por favor corrige los errores en el formulario.", extra_tags='alert-error')
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})

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
