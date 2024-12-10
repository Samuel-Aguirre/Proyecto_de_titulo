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
    const respuestasContainer = document.getElementById(`respuestas-${postulante_id}`);
    
    // Ocultar todas las respuestas primero
    document.querySelectorAll('.respuestas-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Mostrar el contenedor como modal
    if (respuestasContainer) {
        respuestasContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
}

function cerrarRespuestasModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('respuestas-container')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

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
    fetch(`/publicaciones/perfil/${userId}/info/`)
        .then(response => response.json())
        .then(data => {
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
                                <h4>Descripción</h4>
                                <div class="descripcion-container">
                                    <p>${data.perfil.descripcion || 'El usuario no ha proporcionado una descripción.'}</p>
                                </div>
                            </div>

                            ${data.perfil && data.perfil.documento_estudiante ? `
                                <div class="perfil-section">
                                    <h4>Documentación Estudiante</h4>
                                    <div class="documento-container">
                                        <div class="documento-item">
                                            <i class="fas fa-file-pdf"></i>
                                            <span>${data.perfil.documento_nombre || 'Documento de estudiante'}</span>
                                            <div class="documento-actions">
                                                <a href="/media/${data.perfil.documento_estudiante}" 
                                                   target="_blank" 
                                                   class="btn-view">
                                                    <i class="fas fa-eye"></i> Ver
                                                </a>
                                                <a href="/media/${data.perfil.documento_estudiante}" 
                                                   download 
                                                   class="btn-download">
                                                    <i class="fas fa-download"></i> Descargar
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="perfil-section">
                                <h4>Hábitos y Preferencias</h4>
                                <div class="preferencias-grid">
                                    <div class="preferencia-item">
                                        <i class="fas fa-smoking-ban"></i>
                                        <span>Fumador: ${data.perfil.fumador}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-glass-cheers"></i>
                                        <span>Bebedor: ${data.perfil.bebedor}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-volume-up"></i>
                                        <span>Nivel de ruido: ${data.perfil.nivel_ruido || 'No especificado'}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-paw"></i>
                                        <span>Mascotas: ${data.perfil.mascota || 'No'}</span>
                                    </div>
                                    ${data.perfil.tipo_mascota ? `
                                        <div class="preferencia-item">
                                            <i class="fas fa-dog"></i>
                                            <span>Tipo de mascota: ${data.perfil.tipo_mascota}</span>
                                        </div>
                                    ` : ''}
                                    <div class="preferencia-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Horario de llegada: ${data.perfil.horario_llegada || 'No especificado'}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-dollar-sign"></i>
                                        <span>Presupuesto máximo: ${data.perfil.presupuesto_max || 'No especificado'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

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

// Función para mostrar/ocultar las respuestas
function toggleRespuestas(postulanteId) {
    const modalHTML = `
        <div id="respuestasModal" class="modal">
            <div class="modal-content">
                <button class="btn-close" onclick="cerrarModalRespuestas()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2>Respuestas del Formulario</h2>
                </div>
                <div class="respuestas-container" id="respuestasBody">
                    <!-- Las respuestas se cargarán aquí -->
                </div>
            </div>
        </div>
    `;

    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Cargar las respuestas
    fetch(`/publicaciones/postulacion/${postulanteId}/respuestas/`)
        .then(response => response.json())
        .then(data => {
            const respuestasBody = document.getElementById('respuestasBody');
            data.respuestas.forEach(respuesta => {
                const coincide = respuesta.respuesta_seleccionada === respuesta.respuesta_esperada;
                const coincidenciaIcon = coincide ? 
                    '<i class="fas fa-check-circle text-success"></i>' : 
                    '<i class="fas fa-times-circle text-danger"></i>';
                
                respuestasBody.insertAdjacentHTML('beforeend', `
                    <div class="respuesta-grupo">
                        <div class="pregunta-texto">${respuesta.pregunta}</div>
                        <div class="respuestas-grid">
                            <div class="respuesta-columna">
                                <h4>Respuesta del Postulante</h4>
                                <p>${respuesta.respuesta_seleccionada}</p>
                            </div>
                            <div class="respuesta-columna">
                                <h4>Respuesta Esperada</h4>
                                <p>${respuesta.respuesta_esperada}</p>
                            </div>
                            <div class="respuesta-columna coincidencia">
                                <h4>Coincidencia</h4>
                                <div class="coincidencia-icon">${coincidenciaIcon}</div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });

    // Mostrar el modal con animación
    const modal = document.getElementById('respuestasModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function cerrarModalRespuestas() {
    const modal = document.getElementById('respuestasModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

// Estilos CSS para el modal de respuestas
const styles = `
    #respuestasModal .modal-content {
        width: 90%;
        max-width: 800px;
        padding: 2rem;
        position: relative;
        max-height: 90vh; /* Altura máxima del 90% de la ventana */
        display: flex;
        flex-direction: column;
    }

    #respuestasModal .respuestas-container {
        overflow-y: auto;
        max-height: calc(80vh - 100px); /* Altura máxima considerando el header */
        padding-right: 1rem; /* Espacio para el scrollbar */
        margin-right: -1rem; /* Compensar el padding */
        
        /* Estilizar scrollbar para navegadores webkit (Chrome, Safari, etc.) */
        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--primary-green);
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #45a049;
        }
    }

    /* Estilizar scrollbar para Firefox */
    #respuestasModal .respuestas-container {
        scrollbar-width: thin;
        scrollbar-color: var(--primary-green) #f1f1f1;
    }

    #respuestasModal .btn-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0.5rem;
        transition: color 0.3s ease;
    }

    #respuestasModal .btn-close:hover {
        color: #dc3545;
    }

    #respuestasModal .modal-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #eee;
    }

    #respuestasModal .modal-header h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.5rem;
    }

    .respuesta-grupo {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .pregunta-texto {
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #eee;
    }

    .respuestas-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-top: 1rem;
    }

    .respuesta-columna {
        text-align: center;
    }

    .respuesta-columna h4 {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }

    .respuesta-columna p {
        color: var(--text-primary);
        font-weight: 500;
        margin: 0;
    }

    .coincidencia {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .coincidencia-icon {
        font-size: 1.5rem;
        margin-top: 0.5rem;
    }

    .coincidencia-icon i {
        font-size: 1.5rem;
    }

    .text-success {
        color: #28a745;
    }

    .text-danger {
        color: #dc3545;
    }

    @media (max-width: 768px) {
        .respuestas-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .respuesta-columna {
            padding: 0.5rem;
            border-bottom: 1px solid #eee;
        }

        .respuesta-columna:last-child {
            border-bottom: none;
        }

        #respuestasModal .modal-content {
            width: 95%;
            padding: 1rem;
        }
    }
`;

// Agregar los estilos al documento
if (!document.getElementById('respuestas-modal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'respuestas-modal-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

function mostrarPerfilPostulante(userId) {
    fetch(`/publicaciones/perfil/${userId}/info/`)
        .then(response => response.json())
        .then(data => {
            const perfilHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${data.nombre} ${data.apellido}</h2>
                        <button type="button" class="close" onclick="cerrarModalPerfil()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <h3>Información Personal</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <i class="fas fa-envelope"></i>
                                <span>${data.email}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-phone"></i>
                                <span>${data.telefono}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-university"></i>
                                <span>${data.universidad}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-graduation-cap"></i>
                                <span>${data.carrera}</span>
                            </div>
                        </div>

                        ${data.perfil.documento_estudiante ? `
                            <div class="documento-section">
                                <h3>Documentos del Estudiante</h3>
                                <div class="documento-container">
                                    <div class="documento-item">
                                        <i class="fas fa-file-alt"></i>
                                        <span>${data.perfil.documento_nombre}</span>
                                        <div class="documento-actions">
                                            <a href="${data.perfil.documento_url}" target="_blank" class="btn-view">
                                                <i class="fas fa-eye"></i> Ver
                                            </a>
                                            <a href="${data.perfil.documento_url}" download class="btn-download">
                                                <i class="fas fa-download"></i> Descargar
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <h3>Hábitos y Preferencias</h3>
                        <div class="habits-grid">
                            <div class="habit-item">
                                <i class="fas fa-smoking"></i>
                                <span>Fumador: ${data.perfil.fumador}</span>
                            </div>
                            <div class="habit-item">
                                <i class="fas fa-glass-cheers"></i>
                                <span>Bebedor: ${data.perfil.bebedor}</span>
                            </div>
                            <div class="habit-item">
                                <i class="fas fa-paw"></i>
                                <span>Mascotas: ${data.perfil.mascota}</span>
                            </div>
                            <div class="habit-item">
                                <i class="fas fa-volume-up"></i>
                                <span>Nivel de ruido: ${data.perfil.nivel_ruido}</span>
                            </div>
                            <div class="habit-item">
                                <i class="far fa-clock"></i>
                                <span>Horario de llegada: ${data.perfil.horario_llegada}</span>
                            </div>
                            <div class="habit-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>Presupuesto máximo: ${data.perfil.presupuesto_max}</span>
                            </div>
                        </div>

                        <div class="description-section">
                            <h3>Descripción</h3>
                            <p>${data.perfil.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                </div>`;

            const modalContainer = document.getElementById('perfilModal');
            modalContainer.innerHTML = perfilHTML;
            modalContainer.style.display = 'flex';
            setTimeout(() => modalContainer.classList.add('show'), 10);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el perfil');
        });
} 