# Generated by Django 5.1.2 on 2024-11-22 23:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ArrendaU_app', '0005_compatibilidad_descripcion'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='compatibilidad',
            name='descripcion',
        ),
        migrations.AddField(
            model_name='compatibilidad',
            name='descripcion_compatibilidad',
            field=models.TextField(blank=True, null=True),
        ),
    ]
