# Generated by Django 5.1.2 on 2024-12-06 23:33

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ArrendaU_pagos', '0003_pago_detalles_transaccion_pago_fecha_aprobacion_and_more'),
        ('ArrendaU_publicaciones_app', '0004_alter_publicacion_estado'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='pago',
            name='estado',
            field=models.CharField(choices=[('PENDIENTE', 'Pendiente'), ('APROBADO', 'Aprobado'), ('RECHAZADO', 'Rechazado'), ('ANULADO', 'Anulado'), ('ERROR', 'Error')], default='PENDIENTE', max_length=20),
        ),
        migrations.AlterField(
            model_name='pago',
            name='publicacion',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pagos', to='ArrendaU_publicaciones_app.publicacion'),
        ),
        migrations.AlterField(
            model_name='pago',
            name='usuario',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]
