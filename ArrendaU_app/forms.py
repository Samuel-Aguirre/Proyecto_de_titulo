from django import forms
from .models import PerfilArrendatario, PerfilArrendador

class PerfilArrendatarioForm(forms.ModelForm):
    class Meta:
        model = PerfilArrendatario
        exclude = ['usuario', 'fecha_creacion', 'fecha_actualizacion']
        widgets = {
            'descripcion': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': 'Cuéntanos un poco sobre ti...'
            }),
            'universidad': forms.TextInput(attrs={
                'placeholder': 'Ej: Universidad de La Frontera'
            }),
            'carrera': forms.TextInput(attrs={
                'placeholder': 'Ej: Ingeniería Civil en Informática'
            }),
            'tipo_mascota': forms.TextInput(attrs={
                'placeholder': 'Ej: Gato, Perro pequeño, etc.'
            }),
            'horario_llegada': forms.TimeInput(attrs={
                'type': 'time'
            }),
            'presupuesto_max': forms.NumberInput(attrs={
                'placeholder': 'Presupuesto máximo mensual'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['documento_estudiante'].help_text = 'Sube tu certificado de alumno regular o matrícula (opcional)'
        self.fields['tipo_mascota'].required = False

class PerfilArrendadorForm(forms.ModelForm):
    class Meta:
        model = PerfilArrendador
        exclude = ['usuario', 'fecha_creacion', 'fecha_actualizacion']
        widgets = {
            'descripcion': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': 'Describe tu experiencia como arrendador...'
            }),
            'horario_visitas': forms.TextInput(attrs={
                'placeholder': 'Ej: Lunes a Viernes de 10:00 a 18:00'
            }),
            'reglas_casa': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': 'Describe las reglas principales de la casa...'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in ['pref_no_fumador', 'pref_no_bebedor', 'pref_no_mascotas', 
                     'pref_estudiante_verificado', 'pref_nivel_ruido']:
            self.fields[field].help_text = 'Indica qué tan importante es esta preferencia para ti' 