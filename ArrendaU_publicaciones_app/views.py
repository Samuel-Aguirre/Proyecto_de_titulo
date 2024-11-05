from django.shortcuts import render, redirect
from .models import Publicacion
from .forms import PublicacionForm
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def crear_publicacion(request):
    if request.user.rol != 'Arrendador':
        return redirect('dashboard')

    if request.method == 'POST':
        form = PublicacionForm(request.POST, request.FILES)
        if form.is_valid():
            publicacion = form.save(commit=False)
            publicacion.usuario = request.user
            publicacion.save()
            return redirect('dashboard')
    else:
        form = PublicacionForm()

    return render(request, 'crear_publicacion.html', {'form': form})

@login_required
def listar_publicaciones(request):
    publicaciones = Publicacion.objects.all()
    return render(request, 'dashboard.html', {'publicaciones': publicaciones, 'user': request.user})
