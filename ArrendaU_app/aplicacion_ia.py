from anthropic import Anthropic
from django.conf import settings
from .models import Compatibilidad, PerfilArrendador, PerfilArrendatario
from ArrendaU_publicaciones_app.models import Publicacion
import json

def analizar_compatibilidad(arrendatario_id, publicacion_id):
    """
    Analiza la compatibilidad entre un arrendatario y un arrendador usando Claude AI.
    
    Args:
        arrendatario_id (int): ID del perfil del arrendatario
        publicacion_id (int): ID de la publicación
    
    Returns:
        float: Porcentaje de compatibilidad
    """
    try:
        # Obtener perfiles
        perfil_arrendatario = PerfilArrendatario.objects.get(id=arrendatario_id)
        publicacion = Publicacion.objects.get(id=publicacion_id)
        perfil_arrendador = publicacion.usuario.perfilarrendador

        print(f"Analizando compatibilidad para arrendatario {arrendatario_id} y publicación {publicacion_id}")

        # Preparar datos para el análisis
        datos_arrendatario = {
            "bebedor": perfil_arrendatario.get_bebedor_display(),
            "fumador": perfil_arrendatario.get_fumador_display(),
            "mascota": perfil_arrendatario.get_mascota_display(),
            "tipo_mascota": perfil_arrendatario.tipo_mascota,
            "nivel_ruido": dict(perfil_arrendatario._meta.get_field('nivel_ruido').choices).get(perfil_arrendatario.nivel_ruido),
            "horario_llegada": str(perfil_arrendatario.horario_llegada) if perfil_arrendatario.horario_llegada else None,
        }

        datos_arrendador = {
            "pref_no_fumador": dict(perfil_arrendador._meta.get_field('pref_no_fumador').choices).get(perfil_arrendador.pref_no_fumador),
            "pref_no_bebedor": dict(perfil_arrendador._meta.get_field('pref_no_bebedor').choices).get(perfil_arrendador.pref_no_bebedor),
            "pref_no_mascotas": dict(perfil_arrendador._meta.get_field('pref_no_mascotas').choices).get(perfil_arrendador.pref_no_mascotas),
            "pref_nivel_ruido": dict(perfil_arrendador._meta.get_field('pref_nivel_ruido').choices).get(perfil_arrendador.pref_nivel_ruido),
        }

        print("Datos preparados:", json.dumps({
            "arrendatario": datos_arrendatario,
            "arrendador": datos_arrendador
        }, indent=2, ensure_ascii=False))

        # Crear prompt para Claude
        prompt = f"""
        Analiza la compatibilidad entre un arrendatario y las preferencias del arrendador.
        
        Datos del arrendatario:
        {json.dumps(datos_arrendatario, indent=2, ensure_ascii=False)}
        
        Preferencias del arrendador:
        {json.dumps(datos_arrendador, indent=2, ensure_ascii=False)}
        
        Proporciona dos elementos:
        1. Un porcentaje de compatibilidad (número entre 0 y 100)
        2. Una breve explicación (máximo 100 caracteres) de la razón principal de este porcentaje
        
        Formato de respuesta EXACTO (respeta el formato):
        [número]
        [texto explicativo]
        """

        # Inicializar cliente de Anthropic
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        # Obtener respuesta de Claude
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            temperature=0,
            system="Eres un experto en análisis de compatibilidad para alquiler de viviendas. IMPORTANTE: Responde SOLO con un número seguido de un texto explicativo, separados por un salto de línea.",
            messages=[{"role": "user", "content": prompt}]
        )

        # Extraer porcentaje y razón
        respuesta_texto = response.content[0].text.strip()
        print("Respuesta de Claude:", respuesta_texto)
        
        partes = respuesta_texto.split('\n', 1)
        if len(partes) != 2:
            raise ValueError(f"Formato de respuesta inválido: {respuesta_texto}")
            
        porcentaje = float(partes[0].strip())
        descripcion = partes[1].strip()

        print(f"Porcentaje calculado: {porcentaje}")
        print(f"Descripción: {descripcion}")

        # Verificar si ya existe una compatibilidad
        compatibilidad, created = Compatibilidad.objects.get_or_create(
            arrendatario=perfil_arrendatario,
            arrendador=perfil_arrendador,
            publicacion=publicacion,
            defaults={
                'porcentaje': porcentaje,
                'descripcion': descripcion
            }
        )

        if not created:
            compatibilidad.porcentaje = porcentaje
            compatibilidad.descripcion = descripcion
            compatibilidad.save()

        print(f"Compatibilidad {'creada' if created else 'actualizada'} exitosamente")
        return porcentaje, descripcion

    except Exception as e:
        print(f"Error en análisis de compatibilidad: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None