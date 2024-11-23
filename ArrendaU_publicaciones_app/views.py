from django.shortcuts import render, redirect, get_object_or_404
from .models import Publicacion, Foto, FormularioCompatibilidad, PreguntaFormulario, OpcionRespuesta, RespuestaArrendatario, RespuestaPregunta, PublicacionGuardada, Notificacion
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import PublicacionForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Q
import json
from ArrendaU_app.models import Usuario, Compatibilidad  # Importamos Compatibilidad desde ArrendaU_app.models
from ArrendaU_app.aplicacion_ia import analizar_compatibilidad

@login_required
def crear_publicacion(request):
    if request.user.rol != 'Arrendador':
        return redirect('dashboard')

    if request.method == 'POST':
        try:
            # Crear la publicación
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

            # Manejar las fotos
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

            # Crear el formulario de compatibilidad
            datos_formulario = json.loads(request.POST.get('preguntas_compatibilidad', '{}'))
            if datos_formulario:
                formulario = FormularioCompatibilidad.objects.create(
                    publicacion=publicacion
                )

                for i, pregunta_texto in enumerate(datos_formulario.get('preguntas', [])):
                    pregunta = PreguntaFormulario.objects.create(
                        formulario=formulario,
                        texto_pregunta=pregunta_texto,
                        respuesta_esperada=datos_formulario['respuestas_esperadas'][i],
                        orden=i
                    )

                    # Crear las opciones de respuesta para esta pregunta
                    for j, opcion_texto in enumerate(datos_formulario['opciones'][i]):
                        OpcionRespuesta.objects.create(
                            pregunta=pregunta,
                            texto_opcion=opcion_texto,
                            orden=j
                        )

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
        publicaciones = Publicacion.objects.filter(usuario=request.user)
    else:
        # Si es arrendatario, mostrar solo publicaciones activas
        publicaciones = Publicacion.objects.filter(activa=True)
    
    return render(request, 'dashboard.html', {
        'publicaciones': publicaciones
    })

@login_required
def editar_publicacion(request, publicacion_id):
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    
    if request.user != publicacion.usuario:
        messages.error(request, 'No tienes permiso para editar esta publicación')
        return redirect('dashboard')
    
    if request.method == 'POST':
        try:
            # Actualizar datos básicos de la publicación
            publicacion.titulo = request.POST.get('title')
            publicacion.descripcion = request.POST.get('description')
            publicacion.region = request.POST.get('region')
            publicacion.ciudad = request.POST.get('city')
            publicacion.direccion = request.POST.get('address')
            publicacion.numero_contacto = request.POST.get('contact')
            publicacion.habitaciones_disponibles = int(request.POST.get('rooms'))
            publicacion.valor_alquiler = int(request.POST.get('rental-value'))
            publicacion.save()
            
            # Manejar fotos nuevas
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
            
            # Actualizar formulario de compatibilidad
            datos_formulario = json.loads(request.POST.get('preguntas_compatibilidad', '{}'))
            if datos_formulario:
                # Eliminar formulario existente y sus relaciones
                FormularioCompatibilidad.objects.filter(publicacion=publicacion).delete()
                
                # Crear nuevo formulario
                formulario = FormularioCompatibilidad.objects.create(
                    publicacion=publicacion
                )

                for i, pregunta_texto in enumerate(datos_formulario.get('preguntas', [])):
                    pregunta = PreguntaFormulario.objects.create(
                        formulario=formulario,
                        texto_pregunta=pregunta_texto,
                        respuesta_esperada=datos_formulario['respuestas_esperadas'][i],
                        orden=i
                    )

                    # Crear las opciones de respuesta para esta pregunta
                    for j, opcion_texto in enumerate(datos_formulario['opciones'][i]):
                        OpcionRespuesta.objects.create(
                            pregunta=pregunta,
                            texto_opcion=opcion_texto,
                            orden=j
                        )
            
            messages.success(request, 'Publicación actualizada exitosamente')
            return redirect(request.GET.get('next', 'dashboard'))
            
        except Exception as e:
            messages.error(request, f'Error al actualizar la publicación: {str(e)}')
    
    # Preparar datos del formulario existente para el template
    formulario_data = None
    try:
        if hasattr(publicacion, 'formulario'):
            preguntas_data = []
            for pregunta in publicacion.formulario.preguntas.all():
                opciones = list(pregunta.opciones.values_list('texto_opcion', flat=True))
                preguntas_data.append({
                    'texto': pregunta.texto_pregunta,
                    'opciones': opciones,
                    'respuesta_esperada': pregunta.respuesta_esperada
                })
            formulario_data = preguntas_data
    except Exception as e:
        print(f"Error al obtener datos del formulario: {e}")
            
    return render(request, 'publicacion_form.html', {
        'publicacion': publicacion,
        'regiones': Publicacion.REGIONES_CHOICES,
        'formulario_data': formulario_data
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

def filtrar_publicaciones(request):
    try:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Obtener parámetros de filtrado
            ciudad = request.GET.get('ciudad', '').strip()
            habitaciones = request.GET.get('habitaciones', '')
            min_precio = request.GET.get('min_precio', 0)
            max_precio = request.GET.get('max_precio', 400000)

            # Convertir a enteros los valores numéricos
            try:
                min_precio = int(min_precio)
                max_precio = int(max_precio)
            except ValueError:
                min_precio = 0
                max_precio = 400000

            # Iniciar con todas las publicaciones
            queryset = Publicacion.objects.all()

            # Aplicar filtros solo si se proporcionan valores válidos
            if ciudad:
                queryset = queryset.filter(ciudad__icontains=ciudad)
            
            if habitaciones:
                if habitaciones == '4':  # Para "4+" habitaciones
                    queryset = queryset.filter(habitaciones_disponibles__gte=4)
                else:
                    try:
                        habitaciones = int(habitaciones)
                        queryset = queryset.filter(habitaciones_disponibles=habitaciones)
                    except ValueError:
                        pass

            queryset = queryset.filter(
                valor_alquiler__gte=min_precio,
                valor_alquiler__lte=max_precio
            )

            # Preparar datos para la respuesta
            publicaciones = []
            for pub in queryset:
                fotos = [{'imagen_url': foto.imagen.url} for foto in pub.fotos.all()]
                
                # Obtener el perfil del arrendador
                try:
                    perfil_arrendador = pub.usuario.perfilarrendador
                    preferencias = {
                        'pref_no_fumador': perfil_arrendador.get_pref_no_fumador_display(),
                        'pref_no_bebedor': perfil_arrendador.get_pref_no_bebedor_display(),
                        'pref_no_mascotas': perfil_arrendador.get_pref_no_mascotas_display(),
                        'pref_estudiante_verificado': perfil_arrendador.get_pref_estudiante_verificado_display(),
                        'pref_nivel_ruido': perfil_arrendador.get_pref_nivel_ruido_display(),
                        'horario_visitas': perfil_arrendador.horario_visitas,
                        'reglas_casa': perfil_arrendador.reglas_casa
                    }
                except:
                    preferencias = {
                        'pref_no_fumador': 'No especificado',
                        'pref_no_bebedor': 'No especificado',
                        'pref_no_mascotas': 'No especificado',
                        'pref_estudiante_verificado': 'No especificado',
                        'pref_nivel_ruido': 'No especificado',
                        'horario_visitas': 'No especificado',
                        'reglas_casa': 'No especificadas'
                    }

                publicaciones.append({
                    'id': pub.id,
                    'titulo': pub.titulo,
                    'descripcion': pub.descripcion,
                    'ciudad': pub.ciudad,
                    'direccion': pub.direccion,
                    'valor_alquiler': pub.valor_alquiler,
                    'habitaciones_disponibles': pub.habitaciones_disponibles,
                    'fotos': fotos,
                    'preferencias_arrendador': preferencias
                })

            return JsonResponse({'publicaciones': publicaciones})
        
        return JsonResponse({'error': 'Invalid request'}, status=400)
    
    except Exception as e:
        print(f"Error en filtrar_publicaciones: {str(e)}")  # Para debugging
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def obtener_fotos_publicacion(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        fotos = [{'imagen_url': foto.imagen.url} for foto in publicacion.fotos.all()]
        
        # Obtener preferencias del arrendador
        try:
            perfil_arrendador = publicacion.usuario.perfilarrendador
            preferencias = {
                'pref_no_fumador': perfil_arrendador.get_pref_no_fumador_display(),
                'pref_no_bebedor': perfil_arrendador.get_pref_no_bebedor_display(),
                'pref_no_mascotas': perfil_arrendador.get_pref_no_mascotas_display(),
                'pref_estudiante_verificado': perfil_arrendador.get_pref_estudiante_verificado_display(),
                'pref_nivel_ruido': perfil_arrendador.get_pref_nivel_ruido_display(),
                'horario_visitas': perfil_arrendador.horario_visitas,
                'reglas_casa': perfil_arrendador.reglas_casa
            }
        except:
            preferencias = None

        return JsonResponse({
            'fotos': fotos,
            'preferencias': preferencias
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def responder_formulario(request, publicacion_id):
    if request.method == 'POST':
        try:
            publicacion = get_object_or_404(Publicacion, id=publicacion_id)
            formulario = publicacion.formulario
            
            # Crear la respuesta del arrendatario
            respuesta_arrendatario = RespuestaArrendatario.objects.create(
                usuario=request.user,
                formulario=formulario
            )
            
            # Procesar cada respuesta del formulario
            for pregunta in formulario.preguntas.all():
                respuesta = request.POST.get(f'pregunta_{pregunta.id}')
                if respuesta:
                    RespuestaPregunta.objects.create(
                        respuesta_arrendatario=respuesta_arrendatario,
                        pregunta=pregunta,
                        respuesta_seleccionada=respuesta
                    )
            
            # Analizar compatibilidad inmediatamente después de crear la postulación
            try:
                porcentaje, descripcion = analizar_compatibilidad(
                    request.user.perfilarrendatario.id,
                    publicacion_id
                )
                if porcentaje is None:
                    print("Error: No se pudo calcular la compatibilidad")
            except Exception as e:
                print(f"Error al analizar compatibilidad: {str(e)}")
            
            return JsonResponse({
                'success': True,
                'message': 'Formulario enviado correctamente'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al procesar el formulario: {str(e)}'
            }, status=400)
            
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
def obtener_formulario(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        if not hasattr(publicacion, 'formulario'):
            return JsonResponse({
                'success': False,
                'message': 'Esta publicación no tiene un formulario asociado'
            })
            
        preguntas = []
        for pregunta in publicacion.formulario.preguntas.all():
            opciones = list(pregunta.opciones.values_list('texto_opcion', flat=True))
            preguntas.append({
                'id': pregunta.id,
                'texto': pregunta.texto_pregunta,
                'opciones': opciones
            })
            
        return JsonResponse({
            'success': True,
            'formulario': {
                'id': publicacion.formulario.id,
                'preguntas': preguntas
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener el formulario: {str(e)}'
        }, status=400)

@login_required
def mis_postulaciones(request):
    postulaciones = RespuestaArrendatario.objects.filter(
        usuario=request.user
    ).select_related(
        'formulario__publicacion'
    ).prefetch_related(
        'formulario__publicacion__fotos',
        'respuestas__pregunta'
    ).order_by('-fecha_respuesta')
    
    return render(request, 'mis_postulaciones.html', {
        'postulaciones': postulaciones
    })

@login_required
def eliminar_postulacion(request, postulacion_id):
    if request.method == 'POST':
        try:
            postulacion = RespuestaArrendatario.objects.get(
                id=postulacion_id,
                usuario=request.user
            )
            postulacion.delete()
            return JsonResponse({'success': True})
        except RespuestaArrendatario.DoesNotExist:
            return JsonResponse({'error': 'Postulación no encontrada'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@login_required
def publicaciones_guardadas(request):
    guardados = PublicacionGuardada.objects.filter(
        usuario=request.user
    ).select_related(
        'publicacion'
    ).prefetch_related(
        'publicacion__fotos',
        'publicacion__usuario__perfilarrendador'
    )
    
    return render(request, 'publicaciones_guardadas.html', {
        'publicaciones_guardadas': guardados
    })

@login_required
@require_POST
def toggle_guardado(request, publicacion_id):
    try:
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        guardado = PublicacionGuardada.objects.filter(
            usuario=request.user,
            publicacion=publicacion
        ).first()
        
        if guardado:
            guardado.delete()
            mensaje = 'Publicación eliminada de guardados'
            estado = False
        else:
            PublicacionGuardada.objects.create(
                usuario=request.user,
                publicacion=publicacion
            )
            mensaje = 'Publicación guardada exitosamente'
            estado = True
            
        return JsonResponse({
            'success': True,
            'message': mensaje,
            'is_saved': estado
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
def detalle_publicacion(request, publicacion_id):
    # Verificar que el usuario sea el dueño de la publicación
    publicacion = get_object_or_404(Publicacion, id=publicacion_id)
    if request.user != publicacion.usuario:
        messages.error(request, 'No tienes permiso para ver esta publicación')
        return redirect('dashboard')
    
    # Obtener todos los postulantes para esta publicación
    postulantes = RespuestaArrendatario.objects.filter(
        formulario__publicacion=publicacion
    ).select_related(
        'usuario',
        'formulario'
    ).prefetch_related(
        'respuestas__pregunta',
        'usuario__perfilarrendatario'
    ).order_by('-fecha_respuesta')
    
    # Obtener el porcentaje de compatibilidad de la tabla Compatibilidad
    for postulante in postulantes:
        try:
            compatibilidad = Compatibilidad.objects.get(
                arrendatario=postulante.usuario.perfilarrendatario,
                publicacion=publicacion
            )
            postulante.porcentaje_compatibilidad = int(compatibilidad.porcentaje)
            postulante.descripcion = compatibilidad.descripcion
        except Compatibilidad.DoesNotExist:
            # Si no existe, calcular y guardar
            porcentaje, descripcion = analizar_compatibilidad(
                postulante.usuario.perfilarrendatario.id,
                publicacion.id
            )
            postulante.porcentaje_compatibilidad = int(porcentaje) if porcentaje is not None else 0
            postulante.descripcion = descripcion
    
    return render(request, 'publicacion_postulantes.html', {
        'publicacion': publicacion,
        'postulantes': postulantes
    })

@login_required
@require_POST
def aceptar_postulacion(request, postulacion_id):
    try:
        postulacion = get_object_or_404(RespuestaArrendatario, id=postulacion_id)
        publicacion = postulacion.formulario.publicacion
        
        # Verificar permisos
        if request.user != publicacion.usuario:
            return JsonResponse({
                'success': False,
                'message': 'No tienes permiso para realizar esta acción'
            }, status=403)
        
        # Verificar cupos disponibles
        if publicacion.habitaciones_disponibles <= 0:
            return JsonResponse({
                'success': False,
                'message': 'No hay cupos disponibles'
            })
        
        # Actualizar estado de la postulación
        postulacion.estado = 'ACEPTADO'
        postulacion.save()
        
        # Reducir cupos y verificar si se deben cerrar las postulaciones
        publicacion.habitaciones_disponibles -= 1
        if publicacion.habitaciones_disponibles == 0:
            publicacion.activa = False  # Desactivar la publicación
            # Rechazar todas las postulaciones pendientes
            RespuestaArrendatario.objects.filter(
                formulario__publicacion=publicacion,
                estado='PENDIENTE'
            ).update(estado='RECHAZADO')
        
        publicacion.save()
        
        # Crear notificación para el arrendatario
        Notificacion.objects.create(
            usuario=postulacion.usuario,
            publicacion=publicacion,
            tipo='ACEPTADO',
            mensaje=f'Tu postulación para "{publicacion.titulo}" ha sido aceptada.'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Postulación aceptada correctamente',
            'cupos_restantes': publicacion.habitaciones_disponibles
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
def rechazar_postulacion(request, postulacion_id):
    try:
        postulacion = get_object_or_404(RespuestaArrendatario, id=postulacion_id)
        publicacion = postulacion.formulario.publicacion
        
        # Verificar que el usuario sea el dueño de la publicación
        if request.user != publicacion.usuario:
            return JsonResponse({
                'success': False,
                'message': 'No tienes permiso para realizar esta acción'
            }, status=403)
        
        # Actualizar estado de la postulación
        postulacion.estado = 'RECHAZADO'
        postulacion.save()
        
        # Crear notificación para el arrendatario
        Notificacion.objects.create(
            usuario=postulacion.usuario,
            publicacion=publicacion,
            tipo='RECHAZADO',
            mensaje=f'Tu postulación para "{publicacion.titulo}" ha sido rechazada.'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Postulación rechazada correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
def obtener_notificaciones(request):
    notificaciones = Notificacion.objects.filter(
        usuario=request.user,
        leida=False
    ).order_by('-fecha_creacion')
    
    return JsonResponse({
        'notificaciones': [{
            'id': n.id,
            'tipo': n.tipo,
            'mensaje': n.mensaje,
            'fecha': n.fecha_creacion.strftime('%d/%m/%Y %H:%M')
        } for n in notificaciones]
    })

@login_required
@require_POST
def marcar_notificacion_leida(request, notificacion_id):
    try:
        notificacion = get_object_or_404(Notificacion, id=notificacion_id, usuario=request.user)
        notificacion.leida = True
        notificacion.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
@require_POST
def cancelar_gestion_postulacion(request, postulacion_id):
    try:
        postulacion = get_object_or_404(RespuestaArrendatario, id=postulacion_id)
        publicacion = postulacion.formulario.publicacion
        
        # Verificar permisos
        if request.user != publicacion.usuario:
            return JsonResponse({
                'success': False,
                'message': 'No tienes permiso para realizar esta acción'
            }, status=403)
        
        # Guardar el estado anterior para saber si debemos notificar
        estado_anterior = postulacion.estado
        
        # Si la postulación estaba aceptada, incrementar cupos disponibles
        if estado_anterior == 'ACEPTADO':
            publicacion.habitaciones_disponibles += 1
            publicacion.activa = True  # Reactivar la publicación si estaba desactivada
            publicacion.save()
            
            # Solo notificar si estamos cancelando una aceptación previa
            Notificacion.objects.create(
                usuario=postulacion.usuario,
                publicacion=publicacion,
                tipo='CANCELADO',
                mensaje=f'Tu postulación aceptada para "{publicacion.titulo}" ha vuelto a estado pendiente.'
            )
        
        # Actualizar estado de la postulación a pendiente
        postulacion.estado = 'PENDIENTE'
        postulacion.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Gestión cancelada correctamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
def obtener_info_perfil(request, user_id):
    try:
        usuario = get_object_or_404(Usuario, id=user_id)  # Cambiado de User a Usuario
        perfil = usuario.perfilarrendatario if hasattr(usuario, 'perfilarrendatario') else None
        
        data = {
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'universidad': perfil.universidad if perfil else None,
            'carrera': perfil.carrera if perfil else None,
            'perfil': {
                # Usar get_field_display() para campos con choices
                'bebedor': perfil.get_bebedor_display() if perfil else None,
                'fumador': perfil.get_fumador_display() if perfil else None,
                'mascota': perfil.get_mascota_display() if perfil else None,
                'tipo_mascota': perfil.tipo_mascota if perfil and perfil.tipo_mascota else None,
                'nivel_ruido': dict(perfil._meta.get_field('nivel_ruido').choices).get(perfil.nivel_ruido) if perfil else None,
                'horario_llegada': perfil.horario_llegada.strftime('%H:%M') if perfil and perfil.horario_llegada else None,
                'presupuesto_max': perfil.presupuesto_max if perfil else None,
                'descripcion': perfil.descripcion if perfil else None
            } if perfil else None
        }
        
        print(f"Data enviada: {data}")  # Debug log
        return JsonResponse(data)
        
    except Exception as e:
        print(f"Error al obtener perfil: {str(e)}")  # Debug log
        return JsonResponse({
            'error': str(e),
            'detail': 'Error al obtener información del perfil'
        }, status=400)

@login_required
def postular(request, publicacion_id):
    try:
        # ... código existente ...
        
        # Analizar compatibilidad
        porcentaje = analizar_compatibilidad(
            request.user.perfilarrendatario.id,
            publicacion_id
        )
        
        if porcentaje is not None:
            # Usar el porcentaje como necesites
            pass
            
        # ... resto del código ...
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
