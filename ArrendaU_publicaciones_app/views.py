from django.shortcuts import render, redirect
from .models import Publicacion, Foto
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def crear_publicacion(request):
    if request.user.rol != 'Arrendador':
        return redirect('dashboard')

    if request.method == 'POST':
        titulo = request.POST.get('title')
        descripcion = request.POST.get('description')
        region = request.POST.get('region')
        ciudad = request.POST.get('city')
        direccion = request.POST.get('address')
        numero_contacto = request.POST.get('contact')
        habitaciones_disponibles = int(request.POST.get('rooms'))
        valor_alquiler = int(request.POST.get('rental-value'))
        fotos = request.FILES.getlist('photos')

        publicacion = Publicacion.objects.create(
            usuario=request.user,
            titulo=titulo,
            descripcion=descripcion,
            region=region,
            ciudad=ciudad,
            direccion=direccion,
            numero_contacto=numero_contacto,
            habitaciones_disponibles=habitaciones_disponibles,
            valor_alquiler=valor_alquiler
        )

        for foto in fotos:
            if foto:
                try:
                    Foto.objects.create(
                        publicacion=publicacion,
                        imagen=foto
                    )
                except Exception as e:
                    print(f"Error al guardar la foto: {e}")

        return redirect('dashboard')

    return render(request, 'crear_publicacion.html')


@login_required
def listar_publicaciones(request):
    publicaciones = Publicacion.objects.all()
    imagenes = Foto.objects.all()
    return render(request, 'dashboard.html', {'publicaciones': publicaciones, 'imagenes':imagenes,'user': request.user})
