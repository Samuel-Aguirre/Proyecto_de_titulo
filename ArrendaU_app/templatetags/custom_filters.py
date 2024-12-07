from django import template
import os

register = template.Library()

@register.filter
def filename(value):
    """
    Retorna solo el nombre del archivo de una ruta completa
    """
    if value:
        return os.path.basename(str(value))
    return '' 