# Generated by Django 5.1.2 on 2024-11-22 03:54

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ArrendaU_publicaciones_app', '0005_publicacion_activa'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('ACEPTADO', 'Postulación Aceptada'), ('RECHAZADO', 'Postulación Rechazada')], max_length=20)),
                ('mensaje', models.TextField()),
                ('leida', models.BooleanField(default=False)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('publicacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ArrendaU_publicaciones_app.publicacion')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]