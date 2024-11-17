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
            publicacion = Publicacion.objects.create(
                usuario_id=request.user.id,
                titulo=request.POST.get('title'),
                descripcion=request.POST.get('description'),
                region=request.POST.get('region'),
                ciudad=request.POST.get('city'),
                direccion=request.POST.get('address'),
                numero_contacto=request.POST.get('contact'),
                habitaciones_disponibles=int(request.POST.get('rooms')),
                valor_alquiler=int(request.POST.get('rental-value'))
            )

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
            messages.error(request, f'Error al crear la publicación: {str(e)}')
            return render(request, 'publicacion_form.html', {
                'publicacion': None,
                'regiones': Publicacion.REGIONES_CHOICES
            })

    return render(request, 'publicacion_form.html', {
        'publicacion': None,
        'regiones': Publicacion.REGIONES_CHOICES
    })

@login_required
def listar_publicaciones(request):
    if request.user.rol == 'Arrendador':
        # Debug: Imprimir información detallada
        print(f"\nDEBUG INFO:")
        print(f"Usuario actual: {request.user.username} (ID: {request.user.id})")
        
        # Obtener todas las publicaciones y sus usuarios para debug
        todas_publicaciones = Publicacion.objects.all()
        print("\nTodas las publicaciones en la base de datos:")
        for pub in todas_publicaciones:
            print(f"- Publicación ID: {pub.id}, Título: {pub.titulo}, Usuario: {pub.usuario.username} (ID: {pub.usuario.id})")
        
        # Filtrar las publicaciones del usuario actual
        publicaciones = Publicacion.objects.filter(usuario_id=request.user.id)
        print("\nPublicaciones filtradas para el usuario actual:")
        for pub in publicaciones:
            print(f"- Publicación ID: {pub.id}, Título: {pub.titulo}")
        
    else:
        # Si es estudiante, muestra todas las publicaciones
        publicaciones = Publicacion.objects.all()
    
    return render(request, 'dashboard.html', {
        'publicaciones': publicaciones,
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
            publicacion.titulo = request.POST.get('title')
            publicacion.descripcion = request.POST.get('description')
            publicacion.region = request.POST.get('region')
            publicacion.ciudad = request.POST.get('city')
            publicacion.direccion = request.POST.get('address')
            publicacion.numero_contacto = request.POST.get('contact')
            publicacion.habitaciones_disponibles = int(request.POST.get('rooms'))
            publicacion.valor_alquiler = int(request.POST.get('rental-value'))
            publicacion.save()
            
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
            return redirect(request.GET.get('next', 'dashboard'))
            
        except Exception as e:
            messages.error(request, f'Error al actualizar la publicación: {str(e)}')
            
    return render(request, 'publicacion_form.html', {
        'publicacion': publicacion,
        'regiones': Publicacion.REGIONES_CHOICES
    })

@login_required
def eliminar_publicacion(request, pk):
    if request.method == 'POST':
        try:
            publicacion = Publicacion.objects.get(pk=pk, usuario=request.user)
            publicacion.delete()
            return JsonResponse({'success': True})
        except Publicacion.DoesNotExist:
            return JsonResponse({'error': 'Publicación no encontrada'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
@require_POST
def eliminar_foto(request, foto_id):
    try:
        foto = get_object_or_404(Foto, id=foto_id)
        
        if request.user != foto.publicacion.usuario:
            return JsonResponse({'error': 'No tienes permiso para eliminar esta foto'}, status=403)
            
        foto.imagen.delete(save=False)
        foto.delete()
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
