from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from ArrendaU.forms import LoginForm, RegisterForm
from .models import Usuario
from ArrendaU_publicaciones_app.models import Publicacion
from django.utils import timezone

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user:
                user.ultimo_login = timezone.now()
                user.save(update_fields=['ultimo_login'])
                login(request, user)
                return redirect('dashboard')  # Redirige a una única vista
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
    return render(request, 'home.html')

@login_required
def dashboard_view(request):
    # Obtén todas las publicaciones
    publicaciones = Publicacion.objects.all()
    return render(request, 'dashboard.html', {'publicaciones': publicaciones})

def logout_view(request):
    logout(request)
    return redirect('home')
