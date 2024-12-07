@login_required
@require_POST
def eliminar_documento(request, perfil_id):
    try:
        perfil = get_object_or_404(PerfilArrendatario, id=perfil_id, usuario=request.user)
        if perfil.documento_estudiante:
            perfil.documento_estudiante.delete()
            perfil.documento_estudiante = None
            perfil.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400) 