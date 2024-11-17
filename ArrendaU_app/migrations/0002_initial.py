# Generated by Django 5.1.2 on 2024-11-17 05:14

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('ArrendaU_app', '0001_initial'),
        ('ArrendaU_publicaciones_app', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.AddField(
            model_name='compatibilidad',
            name='publicacion',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ArrendaU_publicaciones_app.publicacion'),
        ),
        migrations.AddField(
            model_name='compatibilidad',
            name='arrendador',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ArrendaU_app.perfilarrendador'),
        ),
        migrations.AddField(
            model_name='compatibilidad',
            name='arrendatario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='ArrendaU_app.perfilarrendatario'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='groups',
            field=models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='user_permissions',
            field=models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions'),
        ),
        migrations.AddField(
            model_name='perfilarrendatario',
            name='usuario',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='perfilarrendador',
            name='usuario',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='compatibilidad',
            unique_together={('arrendatario', 'publicacion')},
        ),
    ]
