from django import template

register = template.Library()

@register.filter(name='format_precio')
def format_precio(value):
    try:
        return "{:,.0f}".format(float(value)).replace(",", ".")
    except (ValueError, TypeError):
        return value 