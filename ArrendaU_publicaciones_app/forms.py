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
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'region': forms.TextInput(attrs={'class': 'form-control'}),
            'ciudad': forms.TextInput(attrs={'class': 'form-control'}),
            'direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'numero_contacto': forms.TextInput(attrs={'class': 'form-control'}),
            'habitaciones_disponibles': forms.NumberInput(attrs={'class': 'form-control'}),
            'valor_alquiler': forms.NumberInput(attrs={'class': 'form-control'})
        }
        labels = {
            'titulo': 'Título',
            'descripcion': 'Descripción',
            'region': 'Región',
            'ciudad': 'Ciudad',
            'direccion': 'Dirección',
            'numero_contacto': 'Número de Contacto',
            'habitaciones_disponibles': 'Habitaciones Disponibles',
            'valor_alquiler': 'Valor del Alquiler'
        }
