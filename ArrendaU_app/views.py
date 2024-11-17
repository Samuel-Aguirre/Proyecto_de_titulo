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

@login_required
def dashboard_view(request):
    # Obtener publicaciones según el rol del usuario
    if request.user.rol == 'Arrendador':
        # Si es arrendador, solo mostrar sus propias publicaciones
        publicaciones = Publicacion.objects.filter(usuario=request.user)
    else:
        # Si es estudiante, mostrar todas las publicaciones
        publicaciones = Publicacion.objects.all()
        
    return render(request, 'dashboard.html', {
        'publicaciones': publicaciones,
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
            form.save()
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
    else:
        request.user.rol = 'Arrendador'
    
    request.user.save()
    messages.success(request, f'Tu rol ha sido cambiado a {request.user.rol}')
    return redirect('dashboard')
