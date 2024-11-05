# publicaciones/forms.py

from django import forms
from  ArrendaU_publicaciones_app.models import Publicacion

class PublicacionForm(forms.ModelForm):
    class Meta:
        model = Publicacion
        fields = ['descripcion', 'direccion', 'numero_contacto', 'habitaciones_disponibles', 'fotos']
