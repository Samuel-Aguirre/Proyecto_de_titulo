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

    document.body.classList.add('modal-open');
    expandedView.style.display = 'block';
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
    console.log('Intentando mostrar formulario para publicación:', publicacionId); // Debug
    
    // Cerrar la ventana de descripción
    const expandedView = document.getElementById(`expandedView_${publicacionId}`);
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
    .then(response => {
        console.log('Respuesta recibida:', response.status); // Debug
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos:', data); // Debug
        if (data.success) {
            // Crear el modal del formulario
            const modalHTML = `
                <div id="formularioModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Formulario de Compatibilidad</h2>
                            <button class="btn-close" onclick="cerrarFormularioModal()">
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
            
            // Agregar el modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Mostrar el modal
            const modal = document.getElementById('formularioModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            
        } else {
            console.error('Error en la respuesta:', data.message); // Debug
            showNotification('Error', data.message || 'No se pudo cargar el formulario');
        }
    })
    .catch(error => {
        console.error('Error al cargar el formulario:', error);
        showNotification('Error', 'Ocurrió un error al cargar el formulario');
    });
}

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