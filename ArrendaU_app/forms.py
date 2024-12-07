from django import forms
from .models import PerfilArrendatario, PerfilArrendador

class PerfilArrendatarioForm(forms.ModelForm):
    class Meta:
        model = PerfilArrendatario
        fields = [
            'descripcion',
            'universidad',
            'carrera',
            'documento_estudiante',
            'bebedor',
            'fumador',
            'mascota',
            'tipo_mascota',
            'nivel_ruido',
            'horario_llegada',
            'presupuesto_max',
            'telefono',
        ]
        
        widgets = {
            'descripcion': forms.Textarea(attrs={
                'placeholder': 'Cuéntanos algo de ti...',
                'rows': 4
            }),
            'universidad': forms.TextInput(attrs={
                'placeholder': 'Ej: Universidad de La Frontera'
            }),
            'carrera': forms.TextInput(attrs={
                'placeholder': 'Ej: Ingeniería Civil en Informática'
            }),
            'horario_llegada': forms.TimeInput(attrs={'type': 'time'}),
            'telefono': forms.TextInput(attrs={
                'placeholder': '+56 9 XXXX XXXX',
                'class': 'telefono-input'
            }),
            'presupuesto_max': forms.TextInput(attrs={
                'class': 'presupuesto-input',
                'placeholder': '250.000'
            })
        }

    def clean_telefono(self):
        telefono = self.cleaned_data.get('telefono')
        if telefono:
            # Eliminar todos los caracteres no numéricos excepto el +
            telefono = ''.join(c for c in telefono if c.isdigit() or c == '+')
            
            # Si no empieza con +, agregar el prefijo correspondiente
            if not telefono.startswith('+'):
                if telefono.startswith('56'):
                    telefono = '+' + telefono
                else:
                    telefono = '+56' + telefono
            
            # Formatear el número
            if len(telefono) >= 12:  # +56987654321
                telefono = f"{telefono[:3]} {telefono[3:4]} {telefono[4:8]} {telefono[8:12]}"
        return telefono

    def clean_presupuesto_max(self):
        presupuesto = self.cleaned_data.get('presupuesto_max')
        if presupuesto:
            # Eliminar puntos y espacios existentes
            presupuesto = presupuesto.replace('.', '').replace(' ', '')
            # Formatear con puntos
            try:
                valor = int(presupuesto)
                presupuesto = "{:,}".format(valor).replace(',', '.')
            except ValueError:
                raise forms.ValidationError('Ingrese un valor numérico válido')
        return presupuesto

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
                'placeholder': 'Cuéntanos algo de ti...'
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

    def clean(self):
        cleaned_data = super().clean()
        campos_preferencias = [
            'pref_no_fumador', 
            'pref_no_bebedor', 
            'pref_no_mascotas', 
            'pref_estudiante_verificado', 
            'pref_nivel_ruido'
        ]
        
        for campo in campos_preferencias:
            valor = cleaned_data.get(campo)
            if valor == 0:
                self.add_error(campo, 'Por favor, seleccione una opción válida')
        
        return cleaned_data 