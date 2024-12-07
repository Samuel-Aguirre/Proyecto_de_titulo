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
        perfil_arrendatario = PerfilArrendatario.objects.select_related('usuario').get(id=arrendatario_id)
        publicacion = Publicacion.objects.select_related('usuario__perfilarrendador').get(id=publicacion_id)
        perfil_arrendador = publicacion.usuario.perfilarrendador

        # Preparar datos del arrendatario
        datos_arrendatario = {
            "descripcion": perfil_arrendatario.descripcion or "",
            "bebedor": perfil_arrendatario.get_bebedor_display(),
            "fumador": perfil_arrendatario.get_fumador_display(),
            "mascota": perfil_arrendatario.get_mascota_display(),
            "tipo_mascota": perfil_arrendatario.tipo_mascota if perfil_arrendatario.mascota in ['tengo', 'planeo'] else None,
            "nivel_ruido": dict(perfil_arrendatario._meta.get_field('nivel_ruido').choices).get(perfil_arrendatario.nivel_ruido),
            "horario_llegada": str(perfil_arrendatario.horario_llegada) if perfil_arrendatario.horario_llegada else None,
            "presupuesto_max": perfil_arrendatario.presupuesto_max
        }

        # Preparar datos del arrendador
        datos_arrendador = {
            "descripcion": perfil_arrendador.descripcion or "",
            "pref_no_fumador": dict(perfil_arrendador._meta.get_field('pref_no_fumador').choices).get(perfil_arrendador.pref_no_fumador),
            "pref_no_bebedor": dict(perfil_arrendador._meta.get_field('pref_no_bebedor').choices).get(perfil_arrendador.pref_no_bebedor),
            "pref_no_mascotas": dict(perfil_arrendador._meta.get_field('pref_no_mascotas').choices).get(perfil_arrendador.pref_no_mascotas),
            "pref_nivel_ruido": dict(perfil_arrendador._meta.get_field('pref_nivel_ruido').choices).get(perfil_arrendador.pref_nivel_ruido),
            "horario_visitas": perfil_arrendador.horario_visitas or "",
            "reglas_casa": perfil_arrendador.reglas_casa or "",
            "valor_alquiler": publicacion.valor_alquiler
        }

        # Crear prompt para Claude
        prompt = f"""
        Analiza la compatibilidad entre un arrendatario y las preferencias del arrendador para un alquiler.
        
        Datos del arrendatario:
        {json.dumps(datos_arrendatario, indent=2, ensure_ascii=False)}
        
        Preferencias del arrendador y detalles de la publicación:
        {json.dumps(datos_arrendador, indent=2, ensure_ascii=False)}
        
        Considera los siguientes criterios para el análisis:
        1. Compatibilidad de hábitos (fumador, bebedor, mascotas)
        2. Nivel de ruido y tranquilidad
        3. Horarios y rutinas
        4. Presupuesto vs valor del alquiler
        5. Reglas de la casa y restricciones
        
        Proporciona dos elementos:
        1. Un porcentaje de compatibilidad (número entre 0 y 100)
        2. Una breve descripción (máximo 100 caracteres) que explique al arrendador la razón principal del porcentaje.
        
        La descripción debe:
        - Ser concisa y directa
        - Enfocarse en el aspecto más relevante
        - Evitar términos técnicos
        - No mencionar "arrendador" ni "arrendatario"
        - Usar lenguaje natural y amigable
        
        Ejemplos de buenas descripciones:
        - "Cumple con las reglas de la casa y tiene buenos hábitos de convivencia"
        - "Sus horarios nocturnos no coinciden con las normas establecidas"
        - "El presupuesto está por debajo del valor del alquiler"
        
        Formato de respuesta EXACTO:
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
            system="Eres un experto en análisis de compatibilidad para alquiler de viviendas. Proporciona evaluaciones precisas y naturales.",
            messages=[{"role": "user", "content": prompt}]
        )

        # Extraer porcentaje y razón
        respuesta_texto = response.content[0].text.strip()
        partes = respuesta_texto.split('\n', 1)
        
        try:
            # Limpiar el porcentaje de cualquier carácter no numérico
            porcentaje_texto = partes[0].strip().replace('[', '').replace(']', '').replace('%', '')
            porcentaje = float(porcentaje_texto)
            
            # Limpiar la descripción
            descripcion = partes[1].strip() if len(partes) > 1 else "Análisis completado"
            if descripcion.startswith('[') and descripcion.endswith(']'):
                descripcion = descripcion[1:-1]  # Remover corchetes si existen
            
            # Guardar en la base de datos
            compatibilidad = Compatibilidad.objects.create(
                arrendatario=perfil_arrendatario,
                publicacion=publicacion,
                porcentaje=porcentaje,
                descripcion=descripcion
            )

            return porcentaje, descripcion

        except (ValueError, IndexError) as e:
            print(f"Error al procesar la respuesta de la IA: {str(e)}")
            print(f"Respuesta recibida: {respuesta_texto}")
            return None, "Error al procesar la respuesta de compatibilidad"

    except Exception as e:
        print(f"Error en análisis de compatibilidad: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, f"Error al analizar compatibilidad: {str(e)}"