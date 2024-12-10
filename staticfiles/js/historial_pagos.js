document.addEventListener('DOMContentLoaded', function() {
    // Inicializar eventos del modal
    initModal();
});

// Gestión del Modal
function initModal() {
    const modal = document.getElementById('detallesModal');
    const closeBtn = modal.querySelector('.close-modal');

    // Cerrar modal con el botón X
    closeBtn.addEventListener('click', () => closeModal());

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('detallesModal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '1';
    }, 200);
}

// Ver detalles de la transacción
async function verDetalles(pagoId) {
    try {
        const response = await fetch(`/pagos/${pagoId}/detalles/`);
        if (!response.ok) throw new Error('Error al obtener los detalles');
        
        const data = await response.json();
        mostrarDetallesEnModal(data);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los detalles de la transacción');
    }
}

function mostrarDetallesEnModal(detalles) {
    const modalBody = document.querySelector('.modal-body');
    
    const detallesHTML = `
        <div class="transaction-details">
            <div class="detail-group">
                <div class="detail-label">ID de Transacción</div>
                <div class="detail-value">${detalles.payment_id || 'No disponible'}</div>
            </div>
            
            <div class="detail-group">
                <div class="detail-label">Estado</div>
                <div class="detail-value">
                    <span class="pago-estado ${detalles.status?.toLowerCase()}">
                        ${detalles.status_detail || detalles.status || 'No disponible'}
                    </span>
                </div>
            </div>

            <div class="detail-group">
                <div class="detail-label">Método de Pago</div>
                <div class="detail-value">
                    ${detalles.payment_method || 'No disponible'}
                    ${detalles.installments ? ` - ${detalles.installments} cuotas` : ''}
                </div>
            </div>

            <div class="detail-group">
                <div class="detail-label">Fechas</div>
                <div class="detail-value">
                    <div>Creación: ${formatearFecha(detalles.date_created)}</div>
                    ${detalles.date_approved ? 
                        `<div>Aprobación: ${formatearFecha(detalles.date_approved)}</div>` : 
                        ''}
                </div>
            </div>

            <div class="detail-group">
                <div class="detail-label">Detalles del Monto</div>
                <div class="detail-value">
                    <div>Total: $${formatearMonto(detalles.transaction_amount)}</div>
                    ${detalles.taxes_amount ? 
                        `<div>Impuestos: $${formatearMonto(detalles.taxes_amount)}</div>` : 
                        ''}
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = detallesHTML;
    
    const modal = document.getElementById('detallesModal');
    modal.style.display = 'block';
}

// Descargar comprobante
async function descargarComprobante(pagoId) {
    try {
        const response = await fetch(`/pagos/${pagoId}/comprobante/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        
        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.error || 'Error al descargar el comprobante');
        }

        // Verificar el tipo de contenido
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante_${pagoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            throw new Error('El servidor no devolvió un PDF válido');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al descargar',
            text: error.message || 'No se pudo descargar el comprobante',
            confirmButtonColor: '#2E7D32'
        });
    }
}

// Funciones auxiliares
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'No disponible';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearMonto(monto) {
    if (!monto) return '0';
    return new Intl.NumberFormat('es-CL').format(monto);
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#2E7D32'
    });
}

// Añadir al HTML 