document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide messages after 5 seconds
    const messages = document.querySelectorAll('.alert');
    messages.forEach(message => {
        setTimeout(() => {
            message.remove();
        }, 5000);
    });

    // Eventos para los filtros
    const btnFiltrar = document.getElementById('btnFiltrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', aplicarFiltros);
    }

    // Manejar el slider de precios
    const minPriceInput = document.querySelector('.min-price');
    const maxPriceInput = document.querySelector('.max-price');
    const minValueSpan = document.getElementById('min-value');
    const maxValueSpan = document.getElementById('max-value');
    const rangeSelected = document.querySelector('.range-selected');

    if (minPriceInput && maxPriceInput) {
        function actualizarRangoPrecios() {
            const min = parseInt(minPriceInput.value);
            const max = parseInt(maxPriceInput.value);
            
            minValueSpan.textContent = `$${min.toLocaleString()}`;
            maxValueSpan.textContent = `$${max.toLocaleString()}`;
            
            const porcentajeMin = (min / minPriceInput.max) * 100;
            const porcentajeMax = (max / maxPriceInput.max) * 100;
            
            rangeSelected.style.left = `${porcentajeMin}%`;
            rangeSelected.style.right = `${100 - porcentajeMax}%`;
        }

        minPriceInput.addEventListener('input', actualizarRangoPrecios);
        maxPriceInput.addEventListener('input', actualizarRangoPrecios);
        
        // Inicializar valores
        actualizarRangoPrecios();
    }

    initPostularButtons();

    // Agregar manejador para el botón de crear publicación
    const btnCrearPublicacion = document.querySelector('.btn-crear-publicacion');
    if (btnCrearPublicacion) {
        btnCrearPublicacion.addEventListener('click', function(e) {
            e.preventDefault();
            verificarPerfilArrendador();
        });
    }
});

let publicacionIdToDelete = null;

// Para publicaciones activas - requiere confirmación
function showDeleteModal(publicacionId) {
    const modal = document.getElementById('deleteModal');
    modal.dataset.publicacionId = publicacionId;
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Para borradores - eliminación directa
function eliminarBorrador(publicacionId) {
    event.preventDefault();
    event.stopPropagation();  // Esto es crucial para evitar la redirección
    
    // Mostrar confirmación directa usando SweetAlert2
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas eliminar este borrador?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            fetch(`/publicaciones/borrador/${publicacionId}/eliminar/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        'Eliminado',
                        'El borrador ha sido eliminado.',
                        'success'
                    ).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire(
                        'Error',
                        data.error || 'No se pudo eliminar el borrador',
                        'error'
                    );
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire(
                    'Error',
                    'Error al eliminar el borrador',
                    'error'
                );
            });
        }
    });
}

function hideDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function showNotification(title, message) {
    const modal = document.getElementById('notificationModal');
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    
    if (!modal || !titleElement || !messageElement) {
        console.error('No se encontraron los elementos del modal de notificación');
        return;
    }
    
    // Actualizar contenido
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Mostrar el modal con animación
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        hideNotificationModal();
    }, 3000);
}

function hideNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Modificar la función confirmDelete para usar el nuevo sistema de notificaciones
function confirmDelete() {
    const modal = document.getElementById('deleteModal');
    const publicacionId = modal.dataset.publicacionId;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/publicacion/${publicacionId}/eliminar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        hideDeleteModal();
        
        if (data.success) {
            // Mostrar notificación de éxito
            showNotification('Éxito', 'Publicación eliminada correctamente');
            
            // Esperar a que se muestre la notificación y luego recargar
            setTimeout(() => {
                window.location.reload();
            }, 1500); // Esperar 1.5 segundos para que se vea la notificación
        } else {
            showNotification('Error', 'No se pudo eliminar la publicación');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideDeleteModal();
        showNotification('Error', 'Error al eliminar la publicación');
    });
}

// Asegurarse de que los eventos se detengan correctamente
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir la propagación del clic en el botón de eliminar
    document.querySelectorAll('.property-actions .btn-action.btn-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showDeleteModal(this.dataset.id);
        });
    });

    // Cerrar el modal al hacer clic fuera del contenido
    document.getElementById('deleteModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideDeleteModal();
        }
    });
});

// Agregar logs para debugging cuando el script se carga
console.log('Script de dashboard cargado correctamente');

// Función para aplicar los filtros
function aplicarFiltros() {
    const ciudad = document.getElementById('city')?.value || '';
    const habitaciones = document.getElementById('rooms')?.value || '';
    const minPrecio = document.querySelector('.min-price')?.value || 0;
    const maxPrecio = document.querySelector('.max-price')?.value || 400000;

    // Obtener el token CSRF de manera robusta
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    if (!csrfToken) {
        console.error('No se pudo encontrar el token CSRF');
        showNotification('Error', 'Error de seguridad. Por favor, recarga la página.');
        return;
    }

    // Construir la URL con los parámetros de filtrado
    const params = new URLSearchParams();
    if (ciudad) params.append('ciudad', ciudad);
    if (habitaciones) params.append('habitaciones', habitaciones);
    if (minPrecio) params.append('min_precio', minPrecio);
    if (maxPrecio) params.append('max_precio', maxPrecio);

    // Mostrar indicador de carga
    const listingsContainer = document.querySelector('.dashboard-listings');
    if (listingsContainer) {
        listingsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando resultados...</p>
            </div>
        `;
    }

    // Realizar la petición al servidor
    fetch(`/publicaciones/filtrar/?${params.toString()}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.publicaciones) {
            actualizarListadoPublicaciones(data.publicaciones);
        } else {
            throw new Error('No se recibieron datos de publicaciones');
        }
    })
    .catch(error => {
        console.error('Error al filtrar:', error);
        if (listingsContainer) {
            listingsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar las publicaciones. Por favor, intenta de nuevo.</p>
                </div>
            `;
        }
        showNotification('Error', 'No se pudieron aplicar los filtros. Por favor, intenta de nuevo.');
    });
}

// Función para actualizar el listado de publicaciones en el DOM
function actualizarListadoPublicaciones(publicaciones) {
    const listingsContainer = document.querySelector('.dashboard-listings');
    if (!listingsContainer) return;

    if (!publicaciones || publicaciones.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No se encontraron publicaciones</h3>
                <p>No hay publicaciones que coincidan con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    // Crear el HTML para cada publicación
    const publicacionesHTML = publicaciones.map(pub => {
        const fotoPrincipal = pub.fotos && pub.fotos.length > 0 
            ? pub.fotos[0].imagen_url 
            : '/static/img/default_image.jpg';

        return `
            <article class="property-card" data-publication-id="${pub.id}">
                <div class="property-actions">
                    <button type="button" 
                            class="btn-action btn-bookmark" 
                            onclick="event.stopPropagation(); toggleGuardado('${pub.id}')" 
                            title="Guardar publicación"
                            data-id="${pub.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                <img src="${fotoPrincipal}" alt="${pub.titulo}" class="property-image">
                <div class="property-details">
                    <h3 class="property-title">${pub.titulo}</h3>
                    <div class="property-info">
                        <span>📍 ${pub.ciudad} - ${pub.direccion}</span>
                        <span>💰 ${formatearPrecio(pub.valor_alquiler)}</span>
                        <span>🛏️ ${pub.habitaciones_disponibles} habitaciones</span>
                    </div>
                    <p class="property-description">${pub.descripcion}</p>
                </div>
            </article>
        `;
    }).join('');

    listingsContainer.innerHTML = publicacionesHTML;

    // Reinicializar los eventos después de actualizar el DOM
    initPostularButtons();
}

// Agregar event listeners cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    const btnFiltrar = document.getElementById('btnFiltrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', aplicarFiltros);
    }

    // Aplicar filtros al presionar Enter en los campos de filtro
    const filtrosInputs = document.querySelectorAll('.filters input, .filters select');
    filtrosInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                aplicarFiltros();
            }
        });
    });
});

// Función auxiliar para formatear el precio
function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// Función para expandir la publicación
function expandirPublicacion(element) {
    console.log('Expandiendo publicación...'); // Debug
    
    // Verificar si el usuario está autenticado
    const isAuthenticated = document.body.classList.contains('user-authenticated');
    console.log('¿Usuario autenticado?:', isAuthenticated); // Debug
    
    if (!isAuthenticated) {
        console.log('Usuario no autenticado, mostrando modal de registro'); // Debug
        
        // Verificar que SweetAlert2 esté disponible
        if (typeof Swal === 'undefined') {
            console.error('SweetAlert2 no está cargado');
            alert('Para ver los detalles y postular, necesitas crear una cuenta.');
            return;
        }

        Swal.fire({
            title: '¡Únete a ArrendaU!',
            text: "Para ver los detalles y postular, necesitas crear una cuenta.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#2E7D32',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Registrarme',
            cancelButtonText: 'Más tarde'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/register/';
            }
        });
        return;
    }

    // Si está autenticado, incrementar vistas y mostrar detalles
    if (isAuthenticated) {
        const publicationId = element.dataset.publicationId;
        
        // Incrementar vistas
        fetch(`/publicaciones/publicacion/${publicationId}/vista/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json',
            },
        });

        // Obtener las coordenadas y mostrar el mapa
        fetch(`/publicaciones/publicacion/${publicationId}/coordenadas/`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.latitud && data.longitud) {
                initializeMap(publicationId, data.latitud, data.longitud);
            }
        })
        .catch(error => console.error('Error al cargar el mapa:', error));

        // Mostrar detalles
        const expandedView = document.querySelector(`#expandedView[data-publication-id="${publicationId}"]`);
        if (expandedView) {
            expandedView.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }
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

// Función para contraer la publicación
function contraerPublicacion(button) {
    const expandedSection = button.closest('.property-expanded');
    expandedSection.style.display = 'none';
    document.body.classList.remove('modal-open');
    event.stopPropagation();
}

// Función para cambiar la imagen principal
function cambiarImagenPrincipal(nuevaSrc) {
    event.stopPropagation();
    const mainImage = document.querySelector('.property-expanded .main-image img');
    if (mainImage) {
        mainImage.src = nuevaSrc;
        
        // Resaltar la miniatura seleccionada
        const miniaturas = document.querySelectorAll('.thumbnail-grid img');
        miniaturas.forEach(img => {
            if (img.src === nuevaSrc) {
                img.classList.add('selected');
            } else {
                img.classList.remove('selected');
            }
        });
    }
}

// Cerrar al hacer clic fuera del contenido
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('property-expanded')) {
        event.target.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
});

// Modificar la función mostrarFormularioPostulacion
function mostrarFormularioPostulacion(publicacionId) {
    console.log('Intentando mostrar formulario para publicación:', publicacionId); // Debug
    
    // Cerrar la ventana de descripción
    const expandedView = document.querySelector(`#expandedView[data-publication-id="${publicacionId}"]`);
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
        console.log('Datos del formulario:', data); // Debug
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
                <div id="formularioModal_${publicacionId}" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Formulario de Compatibilidad</h2>
                            <button class="btn-close" onclick="cerrarFormularioModal('${publicacionId}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="formularioCompatibilidad_${publicacionId}" onsubmit="enviarFormulario(event, ${publicacionId})">
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
                                <button type="button" class="btn-cancel" onclick="cerrarFormularioModal('${publicacionId}')">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById(`formularioModal_${publicacionId}`);
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

// Agregar la nueva función para enviar postulación directa
function enviarPostulacionDirecta(publicacionId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/publicacion/${publicacionId}/postular-directo/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
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

function cerrarFormularioModal(publicacionId) {
    const modal = document.getElementById(`formularioModal_${publicacionId}`);
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
                confirmButtonColor: '#2E7D32'  // Color verde que coincide con el tema
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

// Modificar la forma en que manejamos el click en el botón postular
function initPostularButtons() {
    // Remover listeners anteriores si existen
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.removeEventListener('click', handlePostularClick);
    });

    // Agregar nuevos listeners
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.addEventListener('click', handlePostularClick);
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

function toggleGuardado(publicacionId) {
    event.stopPropagation(); // Evitar que se abra la vista expandida
    
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const button = document.querySelector(`.btn-bookmark[data-id="${publicacionId}"]`);
    
    fetch(`/publicaciones/publicacion/${publicacionId}/toggle-guardado/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({}),
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cambiar el estado visual del botón
            button.classList.toggle('active');
            
            // Actualizar el título del botón
            if (data.is_saved) {
                button.title = "Quitar de guardados";
                button.classList.add('active');
                showNotification('Éxito', 'Publicación guardada exitosamente');
            } else {
                button.title = "Guardar publicación";
                button.classList.remove('active');
                showNotification('Éxito', 'Publicación eliminada de guardados');
            }
        } else {
            showNotification('Error', data.message || 'No se pudo actualizar el estado de guardado');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al actualizar el estado de guardado');
    });
}

// Función para actualizar el perfil
function actualizarPerfil(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('/publicaciones/actualizar-perfil/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: data.message
            });
            // Actualizar la información mostrada en el perfil
            actualizarInfoPerfil();
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    });
}

// Función auxiliar para obtener el token CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Asegúrate de que el formulario tenga un event listener
document.addEventListener('DOMContentLoaded', function() {
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', actualizarPerfil);
    }
});

// Función para verificar el perfil del arrendador
function verificarPerfilArrendador() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/perfil/verificar/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.perfil_completo) {
            Swal.fire({
                title: 'Perfil Incompleto',
                html: `
                    <p>Para crear una publicación, primero debes completar tu perfil de arrendador.</p>
                    <p>Esto es necesario para el sistema de compatibilidad con los arrendatarios.</p>
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
        } else {
            window.location.href = '/publicaciones/publicacion/nueva/';
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

function verificarPerfilArrendatario(publicacionId, event) {
    // Prevenir cualquier comportamiento por defecto
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Contraer la publicación antes de mostrar cualquier notificación
    const expandedView = document.querySelector('.property-expanded[style*="display: block"]');
    if (expandedView) {
        expandedView.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/perfil/verificar/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
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

function procesarPago(publicacionId) {
    // Prevenir la propagación del evento si existe
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Hacer la petición AJAX para iniciar el pago
    fetch(`/pagos/iniciar/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirigir al usuario a la página de pago de MercadoPago
            window.location.href = data.init_point;
        } else {
            // Mostrar mensaje de error
            Swal.fire({
                title: 'Error',
                text: data.error || 'Hubo un error al procesar el pago',
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
            text: 'Hubo un error al procesar la solicitud',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2E7D32'
        });
    });
}

function contactarArrendador(publicacionId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Contraer la publicación antes de mostrar cualquier notificación
    const expandedView = document.querySelector(`#expandedView[data-publication-id="${publicacionId}"]`);
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

// Inicializar los botones de toggle cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.btn-toggle-reseñas');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => toggleReseñas(button));
    });
});

// Agregar esta función para manejar la expulsión
function expulsarArrendatario(postulacionId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    Swal.fire({
        title: '¿Estás seguro?',
        text: "Deberás dejar una reseña sobre el arrendatario antes de expulsarlo",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, expulsar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar formulario de reseña
            mostrarFormularioResena(postulacionId, true);
        }
    });
}

// Modificar la función para mostrar el formulario de reseña
function mostrarFormularioResena(postulacionId, esExpulsion = false) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'resenaModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Dejar Reseña</h2>
                <button class="btn-close" onclick="cerrarModalResena()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="formResena" onsubmit="enviarResena(event, ${postulacionId}, ${esExpulsion})">
                <div class="rating-container">
                    <label>Puntuación:</label>
                    <div class="stars">
                        ${[1,2,3,4,5].map(num => `
                            <input type="radio" id="star${num}" name="puntuacion" value="${num}" required>
                            <label for="star${num}"><i class="far fa-star"></i></label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="comentario">Comentario:</label>
                    <textarea id="comentario" name="comentario" required></textarea>
                </div>
                <div class="modal-buttons">
                    <button type="submit" class="btn-submit">Enviar Reseña</button>
                    <button type="button" class="btn-cancel" onclick="cerrarModalResena(${esExpulsion})">Cancelar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Modificar la función para cerrar el modal de reseña
function cerrarModalResena(esExpulsion = false) {
    const modal = document.getElementById('resenaModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            if (esExpulsion) {
                // Si era una expulsión, mostrar mensaje de cancelación
                Swal.fire({
                    title: 'Expulsión cancelada',
                    text: 'La expulsión ha sido cancelada',
                    icon: 'info',
                    confirmButtonColor: '#2E7D32'
                });
            }
        }, 300);
    }
}

// Modificar la función para enviar la reseña
function enviarResena(event, postulacionId, esExpulsion = false) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        puntuacion: formData.get('puntuacion'),
        comentario: formData.get('comentario')
    };

    fetch(`/publicaciones/postulacion/${postulacionId}/resena/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cerrarModalResena();
            
            if (esExpulsion) {
                // Solo si la reseña se envió correctamente, proceder con la expulsión
                realizarExpulsion(postulacionId);
            } else {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Reseña enviada correctamente',
                    icon: 'success',
                    confirmButtonColor: '#2E7D32'
                }).then(() => {
                    window.location.reload();
                });
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Error al enviar la reseña',
                icon: 'error',
                confirmButtonColor: '#2E7D32'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al enviar la reseña',
            icon: 'error',
            confirmButtonColor: '#2E7D32'
        });
    });
}

// Nueva función para realizar la expulsión
function realizarExpulsion(postulacionId) {
    fetch(`/publicaciones/postulacion/${postulacionId}/expulsar/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Expulsión completada',
                text: 'El arrendatario ha sido expulsado y se ha enviado la reseña',
                icon: 'success',
                confirmButtonColor: '#2E7D32'
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Error al expulsar al arrendatario',
                icon: 'error',
                confirmButtonColor: '#2E7D32'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al expulsar al arrendatario',
            icon: 'error',
            confirmButtonColor: '#2E7D32'
        });
    });
}
