# Generated by Django 5.1.2 on 2024-11-19 14:05

import django.contrib.auth.models
import django.contrib.auth.validators
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Compatibilidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('porcentaje', models.FloatField()),
                ('fecha_calculo', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='PerfilArrendador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.TextField(blank=True, max_length=500)),
                ('pref_no_fumador', models.IntegerField(choices=[(1, 'No importante'), (2, 'Preferible'), (3, 'Muy importante')], default=1)),
                ('pref_no_bebedor', models.IntegerField(choices=[(1, 'No importante'), (2, 'Preferible'), (3, 'Muy importante')], default=1)),
                ('pref_no_mascotas', models.IntegerField(choices=[(1, 'No importante'), (2, 'Preferible'), (3, 'Muy importante')], default=1)),
                ('pref_estudiante_verificado', models.IntegerField(choices=[(1, 'No importante'), (2, 'Preferible'), (3, 'Muy importante')], default=1)),
                ('pref_nivel_ruido', models.IntegerField(choices=[(1, 'No importante'), (2, 'Preferible'), (3, 'Muy importante')], default=1)),
                ('horario_visitas', models.CharField(blank=True, max_length=200)),
                ('reglas_casa', models.TextField(blank=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='PerfilArrendatario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.TextField(blank=True, max_length=500)),
                ('universidad', models.CharField(max_length=100)),
                ('carrera', models.CharField(max_length=100)),
                ('documento_estudiante', models.FileField(blank=True, help_text='Certificado de alumno regular o matrícula', upload_to='documentos_estudiante/')),
                ('bebedor', models.CharField(choices=[('no', 'No'), ('casual', 'Casual'), ('si', 'Sí')], max_length=10)),
                ('fumador', models.CharField(choices=[('no', 'No'), ('ocasional', 'Ocasional'), ('si', 'Sí')], max_length=10)),
                ('mascota', models.CharField(choices=[('no', 'No'), ('tengo', 'Ya tengo'), ('planeo', 'Planeo tener')], max_length=10)),
                ('tipo_mascota', models.CharField(blank=True, max_length=50)),
                ('nivel_ruido', models.IntegerField(choices=[(1, 'Muy silencioso'), (2, 'Normal'), (3, 'Ruidoso')], default=2)),
                ('horario_llegada', models.TimeField(blank=True, null=True)),
                ('presupuesto_max', models.IntegerField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Usuario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('rol', models.CharField(choices=[('Arrendador', 'Arrendador'), ('Arrendatario', 'Arrendatario')], max_length=20)),
                ('nombre', models.CharField(max_length=100)),
                ('apellido', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254, unique=True)),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
    ]
