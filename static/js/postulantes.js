document.addEventListener('DOMContentLoaded', function() {
    initGallery();
});

function initGallery() {
    const thumbs = document.querySelectorAll('.thumb');
    const mainImage = document.querySelector('.main-image');

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', function() {
            mainImage.src = this.src;
            
            // Actualizar estado activo
            thumbs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function contactarPostulante(email) {
    window.location.href = `mailto:${email}`;
}

function verPerfil(userId) {
    window.location.href = `/perfil/${userId}/`;
}

function toggleRespuestas(postulante_id) {
    console.log('Toggle respuestas para postulante:', postulante_id);
    
    // Encontrar el contenedor de respuestas
    const respuestasContainer = document.getElementById(`respuestas-${postulante_id}`);
    if (!respuestasContainer) {
        console.error('No se encontró el contenedor de respuestas');
        return;
    }

    // Crear el modal con las respuestas
    const respuestas = [];
    respuestasContainer.querySelectorAll('.respuesta-box').forEach(box => {
        respuestas.push({
            pregunta: box.querySelector('.pregunta').textContent,
            respuesta: box.querySelector('.respuesta').textContent
        });
    });

    const modalHTML = `
        <div id="respuestasModal" class="perfil-modal">
            <div class="perfil-content">
                <div class="perfil-header">
                    <h3>Respuestas del Formulario</h3>
                    <button class="btn-close" onclick="cerrarRespuestasModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="perfil-body">
                    <div class="respuestas-grid">
                        ${respuestas.map(r => `
                            <div class="respuesta-box">
                                <span class="pregunta">${r.pregunta}</span>
                                <span class="respuesta">${r.respuesta}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal con animación
    const modal = document.getElementById('respuestasModal');
    setTimeout(() => modal.classList.add('show'), 10);
}

function cerrarRespuestasModal() {
    const modal = document.getElementById('respuestasModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function cambiarImagen(thumb) {
    const mainImage = document.querySelector('.main-image');
    mainImage.src = thumb.src;
    
    // Actualizar estado activo
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

// Función auxiliar para mostrar notificaciones
function showNotification(type, title, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div class="notification-text">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        </div>
    `;

    const notificationsContainer = document.querySelector('.notifications-container') || 
                                document.createElement('div');
    if (!document.querySelector('.notifications-container')) {
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    // Insertar la nueva notificación al principio del contenedor
    notificationsContainer.insertBefore(notification, notificationsContainer.firstChild);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            if (notificationsContainer.children.length === 0) {
                notificationsContainer.remove();
            }
        }, 300);
    }, 3000);
}

function gestionarPostulacion(postulacionId, accion) {
    console.log(`Gestionando postulación: ${postulacionId}, acción: ${accion}`);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/postulacion/${postulacionId}/${accion}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Obtener la fila del postulante
            const row = document.querySelector(`.table-row:has([onclick*="${postulacionId}"])`);
            if (row) {
                // Actualizar el estado
                const estadoBadge = row.querySelector('.estado-badge');
                if (estadoBadge) {
                    estadoBadge.textContent = accion === 'aceptar' ? 'Aceptado' : 'Rechazado';
                    estadoBadge.className = `estado-badge ${accion === 'aceptar' ? 'aceptado' : 'rechazado'}`;
                }
                
                // Remover los botones de acción
                const accionesContainer = row.querySelector('.col-acciones');
                if (accionesContainer) {
                    accionesContainer.innerHTML = '';
                }
                
                // Si fue aceptado, actualizar cupos disponibles
                if (accion === 'aceptar' && data.cupos_restantes !== undefined) {
                    const cuposBadge = document.querySelector('.status-badge');
                    if (cuposBadge) {
                        cuposBadge.innerHTML = `<i class="fas fa-bed"></i> ${data.cupos_restantes} cupos disponibles`;
                    }

                    // Si no quedan cupos, deshabilitar todos los botones de aceptar
                    if (data.cupos_restantes === 0) {
                        document.querySelectorAll('.btn-action.accept').forEach(btn => {
                            btn.disabled = true;
                            btn.style.opacity = '0.5';
                            btn.style.cursor = 'not-allowed';
                        });
                    }
                }
            }
            
            // Mostrar notificación personalizada según la acción
            const notificationTitle = accion === 'aceptar' ? 'Postulante Aceptado' : 'Postulante Rechazado';
            const notificationMessage = accion === 'aceptar' 
                ? 'El postulante ha sido aceptado exitosamente.' 
                : 'El postulante ha sido rechazado.';
            
            showNotification('success', notificationTitle, notificationMessage);
        } else {
            // Mostrar notificación de error
            const notification = document.createElement('div');
            notification.className = 'notification error';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <div class="notification-text">
                        <strong>Error</strong>
                        <p>${data.message || 'Error al procesar la solicitud'}</p>
                    </div>
                </div>
            `;

            const notificationsContainer = document.querySelector('.notifications-container') || 
                                        document.createElement('div');
            if (!document.querySelector('.notifications-container')) {
                notificationsContainer.className = 'notifications-container';
                document.body.appendChild(notificationsContainer);
            }
            notificationsContainer.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                    if (notificationsContainer.children.length === 0) {
                        notificationsContainer.remove();
                    }
                }, 300);
            }, 3000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al procesar la solicitud');
    });
}

function verPerfilPostulante(userId) {
    fetch(`/publicaciones/perfil/${userId}/info/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        const perfil = data.perfil || {};
        
        const modalHTML = `
            <div id="perfilModal" class="perfil-modal">
                <div class="perfil-content">
                    <div class="perfil-header">
                        <h3>${data.nombre} ${data.apellido}</h3>
                        <button class="btn-close" onclick="cerrarPerfilModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="perfil-body">
                        <div class="perfil-section">
                            <h4>Información Personal</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>${data.email}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-phone"></i>
                                    <span>${data.telefono || 'No especificado'}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-university"></i>
                                    <span>${data.universidad || 'No especificado'}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-graduation-cap"></i>
                                    <span>${data.carrera || 'No especificado'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="perfil-section">
                            <h4>Hábitos y Preferencias</h4>
                            <div class="preferencias-grid">
                                <div class="preferencia-item">
                                    <i class="fas fa-smoking-ban"></i>
                                    <span>Fumador: ${perfil.fumador ? 'Sí' : 'No'}</span>
                                </div>
                                <div class="preferencia-item">
                                    <i class="fas fa-glass-cheers"></i>
                                    <span>Bebedor: ${perfil.bebedor ? 'Sí' : 'No'}</span>
                                </div>
                                <div class="preferencia-item">
                                    <i class="fas fa-volume-up"></i>
                                    <span>Nivel de ruido: ${perfil.nivel_ruido || 'No especificado'}</span>
                                </div>
                                <div class="preferencia-item">
                                    <i class="fas fa-paw"></i>
                                    <span>Mascotas: ${perfil.mascota || 'No'}</span>
                                </div>
                                ${perfil.tipo_mascota ? `
                                    <div class="preferencia-item">
                                        <i class="fas fa-dog"></i>
                                        <span>Tipo de mascota: ${perfil.tipo_mascota}</span>
                                    </div>
                                ` : ''}
                                <div class="preferencia-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Horario de llegada: ${perfil.horario_llegada || 'No especificado'}</span>
                                </div>
                                <div class="preferencia-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>Presupuesto máximo: ${perfil.presupuesto_max ? `$${perfil.presupuesto_max.toLocaleString()}` : 'No especificado'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="perfil-section">
                            <h4>Descripción</h4>
                            <p class="descripcion">${perfil.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('perfilModal');
        setTimeout(() => modal.classList.add('show'), 10);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Error', 'No se pudo cargar la información del perfil');
    });
}

function cerrarPerfilModal() {
    const modal = document.getElementById('perfilModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function cancelarGestion(postulacionId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/postulacion/${postulacionId}/cancelar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Obtener la fila del postulante
            const row = document.querySelector(`.table-row:has([onclick*="${postulacionId}"])`);
            if (row) {
                // Actualizar el estado
                const estadoBadge = row.querySelector('.estado-badge');
                if (estadoBadge) {
                    estadoBadge.textContent = 'Pendiente';
                    estadoBadge.className = 'estado-badge pendiente';
                }
                
                // Actualizar los botones de acción
                const accionesContainer = row.querySelector('.col-acciones');
                if (accionesContainer) {
                    accionesContainer.innerHTML = `
                        <button class="btn-action accept" 
                                onclick="gestionarPostulacion('${postulacionId}', 'aceptar')"
                                title="Aceptar postulación">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action reject" 
                                onclick="gestionarPostulacion('${postulacionId}', 'rechazar')"
                                title="Rechazar postulación">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                }
            }
            
            // Mostrar notificación usando la nueva función
            showNotification('success', 'Gestión Cancelada', 'La gestión de la postulación ha sido cancelada.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al procesar la solicitud');
    });
} 