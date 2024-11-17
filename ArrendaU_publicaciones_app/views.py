from django.shortcuts import render, redirect, get_object_or_404
from .models import Publicacion, Foto
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import PublicacionForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@login_required
def crear_publicacion(request):
    if request.user.rol != 'Arrendador':
        return redirect('dashboard')

    if request.method == 'POST':
        try:
            # Debug: Imprimir información del usuario actual
            print(f"Creando publicación para usuario: {request.user.id}, {request.user.email}")
            
            publicacion = Publicacion.objects.create(
                usuario_id=request.user.id,  # Usamos usuario_id explícitamente
                titulo=request.POST.get('title'),
                descripcion=request.POST.get('description'),
                region=request.POST.get('region'),
                ciudad=request.POST.get('city'),
                direccion=request.POST.get('address'),
                numero_contacto=request.POST.get('contact'),
                habitaciones_disponibles=int(request.POST.get('rooms')),
                valor_alquiler=int(request.POST.get('rental-value'))
            )
            
            # Debug: Verificar la creación
            print(f"Publicación creada: ID={publicacion.id}, Usuario={publicacion.usuario.id}")

            fotos = request.FILES.getlist('photos')
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
        except Exception as e:
            print(f"Error al crear publicación: {e}")
            messages.error(request, f'Error al crear la publicación: {str(e)}')
            return render(request, 'crear_publicacion.html')

    return render(request, 'crear_publicacion.html')

@login_required
def listar_publicaciones(request):
    if request.user.rol == 'Arrendador':
        # Solo mostrar las publicaciones donde el usuario es el propietario
        publicaciones = Publicacion.objects.filter(usuario=request.user)
    else:
        # Para arrendatarios, mostrar todas las publicaciones
        publicaciones = Publicacion.objects.all()
    
    imagenes = Foto.objects.all()
    return render(request, 'dashboard.html', {
        'publicaciones': publicaciones, 
        'imagenes': imagenes,
        'user': request.user
    })

@login_required
def editar_publicacion(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    
    if request.user != publicacion.usuario:
        messages.error(request, 'No tienes permiso para editar esta publicación')
        return redirect('dashboard')
    
    if request.method == 'POST':
        try:
            # Actualizar datos básicos
            publicacion.titulo = request.POST.get('title')
            publicacion.descripcion = request.POST.get('description')
            publicacion.region = request.POST.get('region')
            publicacion.ciudad = request.POST.get('city')
            publicacion.direccion = request.POST.get('address')
            publicacion.numero_contacto = request.POST.get('contact')
            publicacion.habitaciones_disponibles = int(request.POST.get('rooms'))
            publicacion.valor_alquiler = int(request.POST.get('rental-value'))
            publicacion.save()
            
            # Manejar las nuevas fotos
            nuevas_fotos = request.FILES.getlist('photos')
            for foto in nuevas_fotos:
                if foto:
                    try:
                        Foto.objects.create(
                            publicacion=publicacion,
                            imagen=foto
                        )
                    except Exception as e:
                        messages.warning(request, f'Error al guardar una foto: {str(e)}')
            
            messages.success(request, 'Publicación actualizada exitosamente')
            # Usar next para redirigir o por defecto al dashboard
            return redirect(request.GET.get('next', 'dashboard'))
            
        except Exception as e:
            messages.error(request, f'Error al actualizar la publicación: {str(e)}')
            return render(request, 'editar_publicacion.html', {
                'publicacion': publicacion
            })
            
    return render(request, 'editar_publicacion.html', {
        'publicacion': publicacion
    })

@login_required
def eliminar_publicacion(request, publicacion_id):
    try:
        publicacion = Publicacion.objects.get(id=publicacion_id)
        if request.user == publicacion.usuario:
            publicacion.delete()
            messages.success(request, 'Publicación eliminada exitosamente')
        else:
            messages.error(request, 'No tienes permiso para eliminar esta publicación')
    except Publicacion.DoesNotExist:
        messages.error(request, 'La publicación no existe')
    
    return redirect('dashboard')

@login_required
@require_POST
def eliminar_foto(request, foto_id):
    try:
        foto = get_object_or_404(Foto, id=foto_id)
        
        # Verificar que el usuario sea el propietario de la publicación
        if request.user != foto.publicacion.usuario:
            return JsonResponse({'error': 'No tienes permiso para eliminar esta foto'}, status=403)
            
        # Eliminar el archivo físico y el registro de la base de datos
        foto.imagen.delete(save=False)  # Elimina el archivo físico
        foto.delete()  # Elimina el registro de la base de datos
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
