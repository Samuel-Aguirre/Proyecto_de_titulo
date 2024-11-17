from django import forms
from .models import Publicacion

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
