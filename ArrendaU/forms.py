from django import forms
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from ArrendaU_app.models import Usuario

Usuario = get_user_model()

class LoginForm(forms.Form):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'placeholder': 'Correo electrónico'}))
    password = forms.CharField(required=True, widget=forms.PasswordInput(attrs={'placeholder': 'Contraseña'}))

class RegisterForm(forms.ModelForm):
    password1 = forms.CharField(label='Contraseña', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirmar contraseña', widget=forms.PasswordInput)

    class Meta:
        model = Usuario
        fields = ('email', 'nombre', 'apellido', 'rol')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Las contraseñas no coinciden")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        # Generar username basado en el email
        user.username = self.cleaned_data['email'].split('@')[0]
        # Asegurar que el username sea único
        base_username = user.username
        counter = 1
        while Usuario.objects.filter(username=user.username).exists():
            user.username = f"{base_username}{counter}"
            counter += 1
        
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


