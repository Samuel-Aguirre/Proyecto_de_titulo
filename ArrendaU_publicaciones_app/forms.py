from django import forms
from django.utils.text import capfirst
from unidecode import unidecode
from .models import Publicacion
import re

class PublicacionForm(forms.ModelForm):
    class Meta:
        model = Publicacion
        fields = [
            'titulo',
            'descripcion',
            'region',
            'ciudad',
            'direccion',
            'numero_contacto',
            'habitaciones_disponibles',
            'valor_alquiler'
        ]
        widgets = {
            'descripcion': forms.Textarea(attrs={'rows': 4}),
            'direccion': forms.TextInput(attrs={'placeholder': 'Ingrese la dirección completa'}),
            'numero_contacto': forms.TextInput(attrs={'placeholder': '+56 9 XXXX XXXX'}),
        }

    def clean_valor_alquiler(self):
        valor = self.cleaned_data.get('valor_alquiler')
        if valor and valor < 0:
            raise forms.ValidationError('El valor del alquiler no puede ser negativo')
        return valor

    def clean_habitaciones_disponibles(self):
        habitaciones = self.cleaned_data.get('habitaciones_disponibles')
        if habitaciones and habitaciones < 1:
            raise forms.ValidationError('Debe haber al menos una habitación disponible')
        return habitaciones

    def clean_ciudad(self):
        ciudad = self.cleaned_data.get('ciudad')
        if ciudad:
            # Verificar que solo contenga letras y espacios
            if not re.match(r'^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]+$', ciudad):
                raise forms.ValidationError('La ciudad solo debe contener letras y espacios')
            
            # Eliminar acentos y convertir a minúsculas
            ciudad_limpia = unidecode(ciudad.lower().strip())
            # Capitalizar primera letra
            return capfirst(ciudad_limpia)
        return ciudad

    def clean(self):
        cleaned_data = super().clean()
        # Asegurarnos de que la ciudad se formatee incluso si viene del modelo
        if 'ciudad' in cleaned_data:
            cleaned_data['ciudad'] = self.clean_ciudad(cleaned_data['ciudad'])
        return cleaned_data
