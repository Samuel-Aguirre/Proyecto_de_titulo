from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from ArrendaU.forms import LoginForm, RegisterForm
from .models import Usuario
from django.utils import timezone

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            if user:
                user.ultimo_login = timezone.now()  # Actualizar manualmente ultimo_login
                user.save(update_fields=['ultimo_login'])
                login(request, user)
                if user.rol == 'Arrendador':
                    return redirect('dashboard_arrendador')
                else:
                    return redirect('dashboard_arrendatario')
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
            return redirect('register')
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

