from django import template
from django.template.defaultfilters import floatformat

register = template.Library()

@register.filter
def format_precio(value):
    """
    Formatea un número como precio en pesos chilenos
    Ejemplo: 250000 -> $250.000
    """
    try:
        formatted = "${:,.0f}".format(float(value)).replace(",", ".")
        return formatted
    except (ValueError, TypeError):
        return value 