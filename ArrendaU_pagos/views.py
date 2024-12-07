from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, FileResponse
from django.urls import reverse
from django.contrib import messages
from .models import Pago
from ArrendaU_publicaciones_app.models import Publicacion
import mercadopago
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import Image as RLImage
from io import BytesIO
from datetime import datetime
import os

def iniciar_pago(request, publicacion_id):
    try:
        # Verificar solicitud AJAX
        if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': 'Solicitud inválida'
            }, status=400)

        # Obtener la publicación
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        
        # Obtener el último pago para esta publicación
        ultimo_pago = Pago.objects.filter(publicacion=publicacion).order_by('-fecha_creacion').first()
        
        if ultimo_pago:
            # Si hay un pago pendiente, permitir continuar con ese mismo pago
            if ultimo_pago.estado == 'PENDIENTE':
                return JsonResponse({
                    'success': True,
                    'id': ultimo_pago.preference_id,
                    'init_point': ultimo_pago.detalles_transaccion.get('init_point')
                })
            # Si el pago está aprobado, no permitir nuevo pago    
            elif ultimo_pago.estado == 'APROBADO':
                return JsonResponse({
                    'success': False,
                    'error': 'Esta publicación ya tiene un pago aprobado'
                }, status=400)
            # Si el pago fue rechazado, actualizar el mismo registro en vez de crear uno nuevo
            elif ultimo_pago.estado == 'RECHAZADO':
                pago = ultimo_pago
            else:
                # Para otros estados, crear nuevo pago
                pago = Pago(
                    usuario=request.user,
                    publicacion=publicacion,
                    monto=settings.PRECIO_PUBLICACION,
                    estado='PENDIENTE'
                )
        else:
            # Si no existe pago previo, crear uno nuevo
            pago = Pago(
                usuario=request.user,
                publicacion=publicacion,
                monto=settings.PRECIO_PUBLICACION,
                estado='PENDIENTE'
            )

        # Crear preferencia de pago en MercadoPago
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        
        preference_data = {
            "items": [{
                "id": str(publicacion.id),
                "title": f"Publicación: {publicacion.titulo}",
                "quantity": 1,
                "currency_id": "CLP",
                "unit_price": float(settings.PRECIO_PUBLICACION),
                "description": "Publicación de arriendo en ArrendaU",
                "category_id": "services"
            }],
            "payer": {
                "name": request.user.nombre,
                "surname": request.user.apellido,
                "email": request.user.email
            },
            "payment_methods": {
                "excluded_payment_types": [{"id": "ticket"}],
                "installments": 1
            },
            "back_urls": {
                "success": request.build_absolute_uri(reverse('pagos:pago_exitoso')),
                "failure": request.build_absolute_uri(reverse('pagos:pago_fallido')),
                "pending": request.build_absolute_uri(reverse('pagos:pago_pendiente'))
            },
            "external_reference": str(publicacion.id),
            "auto_return": "approved",
            "binary_mode": True
        }

        # Si estamos en modo de prueba, agregar configuración específica
        if getattr(settings, 'MERCADOPAGO_TEST_MODE', False):
            preference_data.update({
                "purpose": "wallet_purchase",  # Esto indica que es una transacción de prueba
                "test_mode": True
            })

        preference_response = sdk.preference().create(preference_data)
        
        if "response" not in preference_response:
            raise Exception(f"Error en la respuesta de MercadoPago: {preference_response}")

        preference = preference_response["response"]
        
        # Actualizar o guardar el pago
        pago.preference_id = preference["id"]
        pago.detalles_transaccion = {
            'preference_id': preference["id"],
            'init_point': preference["init_point"],
            'date_created': preference.get("date_created"),
            'items': preference_data["items"],
            'is_test': True
        }
        pago.save()

        return JsonResponse({
            'success': True,
            'id': preference["id"],
            'init_point': preference["init_point"]
        })

    except Exception as e:
        print(f"Error en iniciar_pago: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }, status=500)

@login_required
def pago_exitoso(request):
    payment_id = request.GET.get('payment_id')
    status = request.GET.get('status')
    external_reference = request.GET.get('external_reference')
    
    try:
        # Obtener información detallada del pago desde MercadoPago
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        payment_info = sdk.payment().get(payment_id)
        
        if payment_info["status"] == 200:
            payment = payment_info["response"]
            
            # Capturar todos los detalles relevantes
            transaction_details = {
                'payment_id': payment_id,
                'status': payment.get('status'),
                'status_detail': payment.get('status_detail'),
                'payment_method': payment.get('payment_method', {}).get('name', 'MercadoPago'),
                'payment_type': payment.get('payment_type'),
                'transaction_amount': payment.get('transaction_amount'),
                'installments': payment.get('installments'),
                'processing_mode': payment.get('processing_mode'),
                'date_created': payment.get('date_created'),
                'date_approved': payment.get('date_approved'),
                'merchant_order_id': payment.get('merchant_order_id'),
                'payment_method_id': payment.get('payment_method_id'),
                'payment_type_id': payment.get('payment_type_id'),
            }

            publicacion = get_object_or_404(Publicacion, id=external_reference)
            pago = get_object_or_404(Pago, publicacion=publicacion)
            
            if status == 'approved':
                pago.estado = 'APROBADO'
                pago.payment_id = payment_id
                pago.merchant_order_id = transaction_details['merchant_order_id']
                pago.metodo_pago = transaction_details['payment_method_id']
                pago.fecha_aprobacion = transaction_details['date_approved']
                pago.detalles_transaccion = transaction_details
                pago.save()
                
                publicacion.estado = 'PUBLICADA'
                publicacion.save()
                
                messages.success(request, '¡Pago procesado exitosamente! Tu publicación ya está activa.')
            
            return redirect('dashboard')
            
    except Exception as e:
        print(f"Error al procesar el pago: {str(e)}")
        messages.error(request, f'Error al procesar el pago: {str(e)}')
        return redirect('dashboard')

@login_required
def pago_fallido(request):
    external_reference = request.GET.get('external_reference')
    
    try:
        publicacion = get_object_or_404(Publicacion, id=external_reference)
        pago = get_object_or_404(Pago, publicacion=publicacion)
        pago.estado = 'RECHAZADO'
        pago.save()
        
        publicacion.estado = 'BORRADOR'
        publicacion.save()
        
        messages.error(request, 'El pago no pudo ser procesado. Por favor intenta nuevamente.')
        
    except Exception as e:
        messages.error(request, f'Error al procesar el pago: {str(e)}')
    
    return redirect('dashboard')

@login_required
def pago_pendiente(request):
    messages.warning(request, 'Tu pago está pendiente de confirmación.')
    return redirect('dashboard')

@csrf_exempt
def webhook(request):
    try:
        print("Webhook recibido:", request.body)  # Debug
        data = json.loads(request.body)
        
        if data["type"] == "payment":
            payment_id = data["data"]["id"]
            print(f"Procesando pago ID: {payment_id}")  # Debug
            
            sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
            payment_info = sdk.payment().get(payment_id)
            
            print("Respuesta de MP:", payment_info)  # Debug
            
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                external_reference = payment["external_reference"]
                status = payment["status"]
                
                # Capturar todos los detalles relevantes
                transaction_details = {
                    'payment_id': payment_id,
                    'status': status,
                    'status_detail': payment.get('status_detail'),
                    'payment_method': payment.get('payment_method', {}).get('name', 'MercadoPago'),
                    'payment_type': payment.get('payment_type'),
                    'transaction_amount': payment.get('transaction_amount'),
                    'taxes_amount': payment.get('taxes_amount'),
                    'installments': payment.get('installments'),
                    'processing_mode': payment.get('processing_mode'),
                    'date_created': payment.get('date_created'),
                    'date_approved': payment.get('date_approved'),
                    'merchant_order_id': payment.get('merchant_order_id'),
                    'card_holder_name': payment.get('card', {}).get('cardholder', {}).get('name'),
                    'payment_method_id': payment.get('payment_method_id'),
                    'payment_type_id': payment.get('payment_type_id'),
                }

                try:
                    publicacion = Publicacion.objects.get(id=external_reference)
                    pago = Pago.objects.get(publicacion=publicacion)
                    
                    if status == "approved":
                        pago.estado = "APROBADO"
                        pago.payment_id = payment_id
                        pago.merchant_order_id = transaction_details['merchant_order_id']
                        pago.metodo_pago = transaction_details['payment_method_id']
                        pago.fecha_aprobacion = transaction_details['date_approved']
                        pago.detalles_transaccion = transaction_details
                        pago.save()
                        
                        publicacion.activa = True
                        publicacion.save()
                        
                        print(f"Pago {payment_id} procesado exitosamente")  # Debug
                    
                    elif status in ["rejected", "cancelled"]:
                        pago.estado = "RECHAZADO"
                        pago.payment_id = payment_id
                        pago.detalles_transaccion = transaction_details
                        pago.save()
                        print(f"Pago {payment_id} rechazado")  # Debug
                
                except Exception as e:
                    print(f"Error procesando pago {payment_id}: {str(e)}")  # Debug
                    return JsonResponse({"error": str(e)}, status=400)
        
        return JsonResponse({"status": "ok"})
        
    except Exception as e:
        print(f"Error en webhook: {str(e)}")  # Debug
        return JsonResponse({"error": str(e)}, status=400)

@login_required
def detalles_pago(request, pago_id):
    try:
        pago = get_object_or_404(Pago, id=pago_id, usuario=request.user)
        detalles = pago.get_detalles_transaccion()
        
        # Agregar información adicional al diccionario de detalles
        detalles.update({
            'publicacion': {
                'titulo': pago.publicacion.titulo,
                'direccion': pago.publicacion.direccion,
                'ciudad': pago.publicacion.ciudad,
            },
            'fecha_creacion': pago.fecha_creacion.isoformat(),
            'fecha_actualizacion': pago.fecha_actualizacion.isoformat(),
            'estado': pago.get_estado_display(),
            'monto_formatted': f"${int(pago.monto):,}",
            'metodo_pago': pago.get_metodo_pago_display(),
        })
        
        return JsonResponse(detalles)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def generar_comprobante(request, pago_id):
    try:
        pago = get_object_or_404(Pago, id=pago_id, usuario=request.user)
        detalles = pago.get_detalles_transaccion()
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # 1. Logo y Encabezado
        try:
            logo_path = os.path.join(settings.STATIC_ROOT, 'img', 'logo.png')
            if os.path.exists(logo_path):
                elements.append(RLImage(logo_path, width=200, height=50))
                elements.append(Spacer(1, 20))
        except Exception as e:
            print(f"Error al cargar el logo: {e}")
            pass

        # 2. Título y Número de Comprobante
        elements.append(Paragraph(
            f"<para alignment='center'><b>COMPROBANTE DE PAGO</b><br/>"
            f"N° {pago.id}</para>",
            ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=20,
                textColor=colors.HexColor('#2E7D32'),
                spaceAfter=20
            )
        ))

        # 3. Detalles del Servicio
        service_data = [
            ['DETALLES DEL SERVICIO', '', ''],
            ['Título Publicación:', pago.publicacion.titulo, ''],  # Primero el título que identifica
            ['Tipo de Servicio:', 'Publicación de Arriendo', ''],  # Tipo de servicio
            ['Ubicación:', f"{pago.publicacion.ciudad}, {pago.publicacion.direccion}", ''],  # Detalles específicos
            ['Valor del Servicio:', f"${int(pago.monto):,}", ''],  # Información monetaria al final
        ]

        if detalles.get('taxes_amount'):
            service_data.append(['Impuestos:', f"${int(detalles['taxes_amount']):,}", ''])
            service_data.append(['Total:', f"${int(detalles.get('transaction_amount', pago.monto)):,}", ''])

        service_table = Table(service_data, colWidths=[150, 250, 90])
        service_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F5')),
            ('SPAN', (0, 0), (2, 0)),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#2E7D32')),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))

        elements.append(service_table)
        elements.append(Spacer(1, 20))

        # 4. Información del Pago
        trans_data = [
            ['INFORMACIÓN DEL PAGO', '', ''],
            ['ID Transacción:', pago.payment_id or 'Pendiente', ''],  # Identificador único primero
            ['Estado:', pago.get_estado_display(), ''],  # Estado actual
            ['Fecha de Pago:', pago.fecha_creacion.strftime('%d/%m/%Y %H:%M'), ''],  # Cronología
            ['Fecha de Aprobación:', pago.fecha_aprobacion.strftime('%d/%m/%Y %H:%M') if pago.fecha_aprobacion else 'Pendiente', ''],
            ['Método de Pago:', pago.get_metodo_pago_display(), ''],  # Detalles del método
        ]

        if detalles.get('installments'):
            trans_data.append(['Cuotas:', str(detalles.get('installments')), ''])

        trans_table = Table(trans_data, colWidths=[150, 250, 90])
        trans_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F5')),
            ('SPAN', (0, 0), (2, 0)),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#2E7D32')),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))
        
        elements.append(trans_table)
        elements.append(Spacer(1, 20))

        # 5. Información del Cliente
        client_data = [
            ['INFORMACIÓN DEL CLIENTE', '', ''],
            ['Nombre:', f"{pago.usuario.nombre} {pago.usuario.apellido}", ''],  # Identificación personal
            ['Tipo de Usuario:', pago.usuario.rol, ''],  # Rol en el sistema
            ['Email:', pago.usuario.email, ''],  # Información de contacto
        ]

        client_table = Table(client_data, colWidths=[150, 250, 90])
        client_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F5')),
            ('SPAN', (0, 0), (2, 0)),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#2E7D32')),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))

        elements.append(client_table)
        elements.append(Spacer(1, 30))

        # 6. Pie de página
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        
        footer_text = [
            "Este documento es un comprobante oficial de pago emitido por ArrendaU.",
            f"Transacción procesada por MercadoPago el {pago.fecha_creacion.strftime('%d/%m/%Y')}",
            "Para cualquier consulta, contacte a soporte@arrendau.cl"
        ]
        
        elements.append(Paragraph("<br/>".join(footer_text), footer_style))

        # Construir PDF
        doc.build(elements)
        buffer.seek(0)
        
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'comprobante_pago_{pago.id}.pdf',
            content_type='application/pdf'
        )
        
    except Exception as e:
        print(f"Error en generar_comprobante: {str(e)}")
        return JsonResponse({
            'error': 'Error al generar el comprobante',
            'detail': str(e)
        }, status=400)
