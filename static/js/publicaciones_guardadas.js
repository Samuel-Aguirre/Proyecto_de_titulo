document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide messages after 5 seconds
    const messages = document.querySelectorAll('.alert');
    messages.forEach(message => {
        setTimeout(() => {
            message.remove();
        }, 5000);
    });

    // Inicializar los botones de postular
    initPostularButtons();

    // Inicializar los botones de toggle cuando se carga el documento
    const toggleButtons = document.querySelectorAll('.btn-toggle-reseñas');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => toggleReseñas(button));
    });
});

function toggleGuardado(publicacionId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/publicacion/${publicacionId}/toggle-guardado/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Eliminar la tarjeta de la publicación
            const card = document.querySelector(`[data-publication-id="${publicacionId}"]`);
            if (card) {
                card.remove();
                const expandedView = document.querySelector(`#expandedView_${publicacionId}`);
                if (expandedView) {
                    expandedView.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
            }

            // Verificar si quedan publicaciones guardadas
            const listings = document.querySelector('.listings');
            if (!listings.querySelector('.property-card')) {
                listings.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bookmark fa-3x"></i>
                        <h2>No tienes publicaciones guardadas</h2>
                        <p>Guarda las publicaciones que te interesen para revisarlas más tarde</p>
                        <a href="/dashboard" class="btn-explore">
                            Explorar Propiedades
                        </a>
                    </div>
                `;
            }

            showNotification('Éxito', 'Publicación eliminada de guardados');
        } else {
            showNotification('Error', data.message || 'No se pudo actualizar el estado de guardado');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al actualizar el estado de guardado');
    });
}

function expandirPublicacion(publicacionId) {
    const expandedView = document.getElementById(`expandedView_${publicacionId}`);
    if (!expandedView) return;

    // Cerrar cualquier otra vista expandida que esté abierta
    document.querySelectorAll('.property-expanded').forEach(view => {
        if (view.id !== `expandedView_${publicacionId}`) {
            view.style.display = 'none';
        }
    });

    // Obtener las coordenadas y mostrar el mapa
    fetch(`/publicaciones/publicacion/${publicacionId}/coordenadas/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.latitud && data.longitud) {
            initializeMap(publicacionId, data.latitud, data.longitud);
        }
    })
    .catch(error => console.error('Error al cargar el mapa:', error));

    document.body.classList.add('modal-open');
    expandedView.style.display = 'block';
}

function initializeMap(publicacionId, lat, lng) {
    if (!lat || !lng) return;

    const mapContainer = document.getElementById(`map-${publicacionId}`);
    if (!mapContainer) return;

    // Crear el mapa
    const map = L.map(mapContainer).setView([lat, lng], 15);

    // Agregar la capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Agregar el marcador
    L.marker([lat, lng]).addTo(map);
}

function contraerPublicacion(button) {
    const expandedSection = button.closest('.property-expanded');
    expandedSection.style.display = 'none';
    document.body.classList.remove('modal-open');
    event.stopPropagation();
}

function cambiarImagenPrincipal(nuevaSrc, publicacionId) {
    event.stopPropagation();
    const mainImage = document.querySelector(`#expandedView_${publicacionId} .main-image img`);
    if (mainImage) {
        mainImage.src = nuevaSrc;
        
        const miniaturas = document.querySelectorAll(`#expandedView_${publicacionId} .thumbnail-grid img`);
        miniaturas.forEach(img => {
            if (img.src === nuevaSrc) {
                img.classList.add('selected');
            } else {
                img.classList.remove('selected');
            }
        });
    }
}

function showNotification(title, message) {
    const modal = document.getElementById('notificationModal');
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const notificationModal = document.getElementById('notificationModal');
    
    if (event.target === notificationModal) {
        hideNotificationModal();
    }
}

function mostrarFormularioPostulacion(publicacionId) {
    console.log('Intentando mostrar formulario para publicación:', publicacionId);
    
    // Cerrar la ventana de descripción
    const expandedView = document.querySelector(`#expandedView_${publicacionId}`);
    if (expandedView) {
        expandedView.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    
    fetch(`/publicaciones/publicacion/${publicacionId}/formulario/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Verificar si hay preguntas en el formulario
            if (!data.formulario.preguntas || data.formulario.preguntas.length === 0) {
                // Si no hay preguntas, mostrar un mensaje y proceder directamente con la postulación
                Swal.fire({
                    title: 'Postulación Directa',
                    text: 'Esta publicación no requiere un formulario de compatibilidad. ¿Deseas postular directamente?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, postular',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#2E7D32',
                    cancelButtonColor: '#d33'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Enviar postulación directa sin respuestas
                        enviarPostulacionDirecta(publicacionId);
                    }
                });
                return;
            }

            // Si hay preguntas, mostrar el formulario normal
            const modalHTML = `
                <div id="formularioModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Formulario de Compatibilidad</h2>
                            <button type="button" class="btn-close" onclick="cerrarFormularioModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="formularioCompatibilidad" onsubmit="enviarFormulario(event, ${publicacionId})">
                            ${data.formulario.preguntas.map(pregunta => `
                                <div class="pregunta-grupo">
                                    <label>${pregunta.texto}</label>
                                    <select name="pregunta_${pregunta.id}" required>
                                        <option value="">Selecciona una opción</option>
                                        ${pregunta.opciones.map(opcion => 
                                            `<option value="${opcion}">${opcion}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            `).join('')}
                            <div class="modal-buttons">
                                <button type="submit" class="btn-submit">Enviar Respuestas</button>
                                <button type="button" class="btn-cancel" onclick="cerrarFormularioModal()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = document.getElementById('formularioModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        } else {
            showNotification('Error', data.message || 'No se pudo cargar el formulario');
        }
    })
    .catch(error => {
        console.error('Error al cargar el formulario:', error);
        showNotification('Error', 'Ocurrió un error al cargar el formulario');
    });
}

function cerrarFormularioModal() {
    const modal = document.getElementById('formularioModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function enviarFormulario(event, publicacionId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/publicacion/${publicacionId}/responder/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Primero cerrar el modal
            cerrarFormularioModal();
            
            // Luego mostrar la notificación de éxito con botón de aceptar
            Swal.fire({
                title: 'Éxito',
                text: 'Formulario enviado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2E7D32'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message || 'Error al enviar el formulario',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2E7D32'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al enviar el formulario',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2E7D32'
        });
    });
}

// Asegurarse de que el botón de cerrar y cancelar funcionen
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-close') || e.target.matches('.btn-cancel')) {
        cerrarFormularioModal();
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('formularioModal');
    if (modal && e.target === modal) {
        cerrarFormularioModal();
    }
});

function handlePostularClick(e) {
    e.stopPropagation();
    console.log('Click en botón postular');  // Debug
    
    // Intentar obtener el ID de diferentes maneras
    let publicacionId = e.target.dataset.publicationId;
    
    if (!publicacionId) {
        const button = e.target.closest('.btn-apply');
        if (button) {
            publicacionId = button.dataset.publicationId;
        }
    }
    
    if (!publicacionId) {
        const expandedView = e.target.closest('.property-expanded');
        if (expandedView) {
            publicacionId = expandedView.dataset.publicationId;
        }
    }

    if (publicacionId) {
        console.log('ID de publicación encontrado:', publicacionId);  // Debug
        mostrarFormularioPostulacion(publicacionId);
    } else {
        console.error('No se encontró el ID de la publicación');
        showNotification('Error', 'No se pudo identificar la publicación');
    }
}

// Modificar initPostularButtons para usar event delegation
function initPostularButtons() {
    // Remover el listener anterior si existe
    document.removeEventListener('click', handlePostularButtonClick);
    
    // Agregar el nuevo listener usando event delegation
    document.addEventListener('click', handlePostularButtonClick);
}

function handlePostularButtonClick(e) {
    const postularButton = e.target.closest('.btn-apply');
    if (postularButton) {
        handlePostularClick(e);
    }
}

function toggleReseñas(button) {
    const reseñasSection = button.closest('.reseñas-section');
    const reseñasContent = reseñasSection.querySelector('.reseñas-content');
    const isExpanded = button.classList.contains('active');

    if (isExpanded) {
        // Contraer
        button.classList.remove('active');
        reseñasContent.classList.remove('show');
    } else {
        // Expandir
        button.classList.add('active');
        reseñasContent.classList.add('show');
    }
}

function contactarArrendador(publicacionId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Contraer la publicación antes de mostrar cualquier notificación
    const expandedView = document.querySelector(`#expandedView_${publicacionId}`);
    if (expandedView) {
        expandedView.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Verificar si ya existe una postulación
    fetch(`/publicaciones/publicacion/${publicacionId}/verificar-postulacion/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.postulacion_existente) {
            // Si existe postulación, obtener info de contacto
            fetch(`/publicaciones/publicacion/${publicacionId}/info-contacto/`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(contactData => {
                if (contactData.success) {
                    Swal.fire({
                        title: 'Información de Contacto',
                        html: `
                            <div class="contact-info-modal">
                                <p><strong>Arrendador:</strong> ${contactData.info_contacto.nombre}</p>
                                <p><strong>Email:</strong> ${contactData.info_contacto.email}</p>
                                <p><strong>Teléfono:</strong> ${contactData.info_contacto.telefono}</p>
                            </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Entendido',
                        customClass: {
                            container: 'contact-info-container'
                        }
                    });
                }
            });
        } else {
            // Si no existe postulación, mostrar mensaje
            Swal.fire({
                title: 'Postulación Requerida',
                html: `
                    <p>Para ver la información de contacto del arrendador, primero debes postular a esta propiedad.</p>
                    <p>¿Deseas postular ahora?</p>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Sí, postular',
                cancelButtonText: 'No, más tarde',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    verificarPerfilArrendatario(publicacionId, null);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un error al verificar tu postulación. Por favor, intenta de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    });
}

function verificarPerfilArrendatario(publicacionId, event) {
    // Prevenir cualquier comportamiento por defecto
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Contraer la publicación antes de mostrar cualquier notificación
    const expandedView = document.querySelector(`#expandedView_${publicacionId}`);
    if (expandedView) {
        expandedView.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    fetch('/perfil/verificar/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.perfil_completo) {
            Swal.fire({
                title: 'Perfil Incompleto',
                html: `
                    <p>Para postular a una propiedad, primero debes completar tu perfil de arrendatario.</p>
                    <p>Esto es necesario para el sistema de compatibilidad con los arrendadores.</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir a completar perfil',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/perfil/editar/';
                }
            });
            return false;
        } else {
            // Solo mostrar el formulario si el perfil está completo
            mostrarFormularioPostulacion(publicacionId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un error al verificar tu perfil. Por favor, intenta de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    });
}

// Agregar la función para postulación directa
function enviarPostulacionDirecta(publicacionId) {
    fetch(`/publicaciones/publicacion/${publicacionId}/postular-directo/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Error en la postulación');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Éxito',
                text: data.message || 'Tu postulación ha sido enviada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2E7D32'
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.message || 'Error al enviar la postulación');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Ocurrió un error al enviar tu postulación',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2E7D32'
        });
    });
}