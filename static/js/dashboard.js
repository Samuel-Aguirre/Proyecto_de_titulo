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
});

let publicacionIdToDelete = null;

function showDeleteModal(publicacionId) {
    console.log('Mostrando modal para publicación:', publicacionId);
    publicacionIdToDelete = publicacionId;
    const modal = document.getElementById('deleteModal');
    if (!modal) {
        console.error('No se encontró el modal de eliminación');
        return;
    }
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        publicacionIdToDelete = null;
    }, 300);
}

function showNotification(title, message) {
    const modal = document.getElementById('notificationModal');
    const titleElement = document.getElementById('notificationTitle');
    const messageElement = document.getElementById('notificationMessage');
    
    if (!modal || !titleElement || !messageElement) {
        console.error('No se encontraron elementos de notificación');
        return;
    }
    
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

function confirmDelete() {
    if (!publicacionIdToDelete) {
        console.log('No hay ID para eliminar');
        return;
    }

    const csrfToken = document.querySelector('#deleteForm [name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/publicacion/${publicacionIdToDelete}/eliminar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('Status de la respuesta:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const card = document.querySelector(`[data-publication-id="${publicacionIdToDelete}"]`);
        if (card) {
            card.remove();
        }
        hideDeleteModal();
        showNotification('Éxito', 'Publicación eliminada correctamente');
    })
    .catch(error => {
        console.error('Error completo:', error);
        hideDeleteModal();
        showNotification('Error', 'No se pudo eliminar la publicación');
    });
}

// Cerrar el modal si se hace clic fuera de él
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteModal');
    const notificationModal = document.getElementById('notificationModal');
    
    if (event.target === deleteModal) {
        hideDeleteModal();
    }
    if (event.target === notificationModal) {
        hideNotificationModal();
    }
}

// Agregar logs para debugging cuando el script se carga
console.log('Script de dashboard cargado correctamente');

// Función para aplicar los filtros
function aplicarFiltros() {
    const ciudad = document.getElementById('city').value;
    const habitaciones = document.getElementById('rooms').value;
    const minPrecio = document.querySelector('.min-price').value;
    const maxPrecio = document.querySelector('.max-price').value;

    // Construir la URL con los parámetros de filtrado
    const params = new URLSearchParams();
    if (ciudad) params.append('ciudad', ciudad);
    if (habitaciones) params.append('habitaciones', habitaciones);
    if (minPrecio) params.append('min_precio', minPrecio);
    if (maxPrecio) params.append('max_precio', maxPrecio);

    // Realizar la petición al servidor
    fetch(`/publicaciones/filtrar/?${params.toString()}`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
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
        // Mostrar mensaje de error más específico
        showNotification('Error', 'No se pudieron aplicar los filtros. Por favor, intenta de nuevo.');
    });
}

// Función para actualizar el listado de publicaciones en el DOM
function actualizarListadoPublicaciones(publicaciones) {
    const listingsContainer = document.querySelector('.listings');
    
    if (!publicaciones || publicaciones.length === 0) {
        listingsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <p>No se encontraron publicaciones con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    listingsContainer.innerHTML = publicaciones.map(pub => `
        <article class="property-card" data-publication-id="${pub.id}" onclick="expandirPublicacion(this)">
            <div class="property-image">
                ${pub.fotos && pub.fotos.length > 0 
                    ? `<img src="${pub.fotos[0].imagen_url}" alt="${pub.titulo}" class="property-image">`
                    : `<img src="/static/img/default_image.jpg" alt="Imagen no disponible" class="property-image">`
                }
            </div>
            <div class="property-details">
                <h3 class="property-title">${pub.titulo}</h3>
                <div class="property-info">
                    <span>📍 ${pub.ciudad} - ${pub.direccion}</span>
                    <span>💰 ${formatearPrecio(pub.valor_alquiler)}</span>
                    <span>🛏️ ${pub.habitaciones_disponibles} habitaciones</span>
                </div>
                <p class="property-description">
                    ${pub.descripcion}
                </p>
            </div>
            <div class="property-expanded" style="display: none;">
                <div class="expanded-content">
                    <div class="expanded-header">
                        <h2>${pub.titulo}</h2>
                        <button class="btn-close" onclick="event.stopPropagation(); contraerPublicacion(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="expanded-grid">
                        <div class="expanded-images">
                            <div class="main-image">
                                ${pub.fotos && pub.fotos.length > 0 
                                    ? `<img src="${pub.fotos[0].imagen_url}" alt="${pub.titulo}">`
                                    : `<img src="/static/img/default_image.jpg" alt="Imagen no disponible">`
                                }
                            </div>
                            <div class="thumbnail-grid">
                                ${pub.fotos.map(foto => `
                                    <img src="${foto.imagen_url}" alt="Foto ${foto.id}" 
                                         onclick="event.stopPropagation(); cambiarImagenPrincipal(this.src)">
                                `).join('')}
                            </div>
                        </div>

                        <div class="expanded-details">
                            <div class="detail-section">
                                <h3>Detalles de la Propiedad</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="label">Ubicación</span>
                                        <span class="value">📍 ${pub.ciudad} - ${pub.direccion}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Precio</span>
                                        <span class="value">💰 ${formatearPrecio(pub.valor_alquiler)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Habitaciones</span>
                                        <span class="value">🛏️ ${pub.habitaciones_disponibles}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="detail-section">
                                <h3>Descripción</h3>
                                <p>${pub.descripcion}</p>
                            </div>

                            <div class="detail-section">
                                <h3>Preferencias del Arrendador</h3>
                                <div class="preferencias-grid">
                                    <div class="preferencia-item">
                                        <i class="fas fa-smoking-ban"></i>
                                        <span>Fumador: ${pub.preferencias_arrendador.pref_no_fumador}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-glass-cheers"></i>
                                        <span>Bebedor: ${pub.preferencias_arrendador.pref_no_bebedor}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-paw"></i>
                                        <span>Mascotas: ${pub.preferencias_arrendador.pref_no_mascotas}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-user-graduate"></i>
                                        <span>Estudiante Verificado: ${pub.preferencias_arrendador.pref_estudiante_verificado}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-volume-up"></i>
                                        <span>Nivel de Ruido: ${pub.preferencias_arrendador.pref_nivel_ruido}</span>
                                    </div>
                                    <div class="preferencia-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Horario de Visitas: ${pub.preferencias_arrendador.horario_visitas}</span>
                                    </div>
                                </div>
                                <div class="reglas-casa">
                                    <h4>Reglas de la Casa</h4>
                                    <p>${pub.preferencias_arrendador.reglas_casa}</p>
                                </div>
                            </div>

                            <div class="contact-section">
                                <button class="btn-contact">
                                    <i class="fas fa-envelope"></i>
                                    Contactar Arrendador
                                </button>
                                <button class="btn-apply">
                                    <i class="fas fa-file-alt"></i>
                                    Postular
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    // Actualizar el CSS para los nuevos elementos
    const cssAdicional = `
        .reglas-casa {
            margin-top: 1.5rem;
            padding: 1rem;
            background: var(--background-light);
            border-radius: 8px;
        }

        .reglas-casa h4 {
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .reglas-casa p {
            color: var(--text-secondary);
            line-height: 1.5;
            white-space: pre-line;
        }
    `;

    // Añadir el CSS si no existe
    if (!document.getElementById('preferencias-css')) {
        const style = document.createElement('style');
        style.id = 'preferencias-css';
        style.textContent = cssAdicional;
        document.head.appendChild(style);
    }

    initPostularButtons();
}

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
function expandirPublicacion(card) {
    if (!document.body.classList.contains('rol-arrendatario')) {
        return;
    }

    const expandedView = document.getElementById('expandedView');
    if (!expandedView) return;

    const publicacionId = card.dataset.publicationId;
    
    // Asignar el ID al expandedView
    expandedView.dataset.publicationId = publicacionId;
    
    fetch(`/publicaciones/obtener-fotos/${publicacionId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Actualizar el contenido del modal
        expandedView.querySelector('h2').textContent = card.querySelector('.property-title').textContent;
        
        // Actualizar la imagen principal
        const modalMainImage = expandedView.querySelector('.main-image img');
        modalMainImage.src = data.fotos[0].imagen_url;
        
        // Actualizar la grid de miniaturas
        const thumbnailGrid = expandedView.querySelector('.thumbnail-grid');
        thumbnailGrid.innerHTML = data.fotos.map(foto => `
            <img src="${foto.imagen_url}" alt="Foto de la propiedad" 
                 onclick="event.stopPropagation(); cambiarImagenPrincipal(this.src)">
        `).join('');

        // Limpiar y actualizar los detalles
        const expandedDetails = expandedView.querySelector('.expanded-details');
        expandedDetails.innerHTML = `
            <div class="detail-section">
                <h3>Detalles de la Propiedad</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">Ubicación</span>
                        <span class="value">📍 ${card.querySelector('.property-info span:nth-child(1)').textContent.replace('📍', '').trim()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Precio</span>
                        <span class="value">💰 ${card.querySelector('.property-info span:nth-child(2)').textContent.replace('💰', '').trim()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Habitaciones</span>
                        <span class="value">🛏️ ${card.querySelector('.property-info span:nth-child(3)').textContent.replace('🛏️', '').trim()}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Descripción</h3>
                <p>${card.querySelector('.property-description').textContent}</p>
            </div>

            <div class="detail-section">
                <h3>Preferencias del Arrendador</h3>
                <div class="preferencias-grid">
                    <div class="preferencia-item">
                        <div class="header">
                            <i class="fas fa-smoking-ban"></i>
                            <span class="label">Fumador</span>
                        </div>
                        <span class="value">${data.preferencias?.pref_no_fumador || 'No especificado'}</span>
                    </div>
                    <div class="preferencia-item">
                        <div class="header">
                            <i class="fas fa-glass-cheers"></i>
                            <span class="label">Bebedor</span>
                        </div>
                        <span class="value">${data.preferencias?.pref_no_bebedor || 'No especificado'}</span>
                    </div>
                    <div class="preferencia-item">
                        <div class="header">
                            <i class="fas fa-paw"></i>
                            <span class="label">Mascotas</span>
                        </div>
                        <span class="value">${data.preferencias?.pref_no_mascotas || 'No especificado'}</span>
                    </div>
                    <div class="preferencia-item">
                        <div class="header">
                            <i class="fas fa-volume-up"></i>
                            <span class="label">Nivel de Ruido</span>
                        </div>
                        <span class="value">${data.preferencias?.pref_nivel_ruido || 'No especificado'}</span>
                    </div>
                    <div class="preferencia-item">
                        <div class="header">
                            <i class="fas fa-user-graduate"></i>
                            <span class="label">Estudiante Verificado</span>
                        </div>
                        <span class="value">${data.preferencias?.pref_estudiante_verificado || 'No especificado'}</span>
                    </div>
                    ${data.preferencias?.horario_visitas ? `
                        <div class="preferencia-item">
                            <div class="header">
                                <i class="fas fa-clock"></i>
                                <span class="label">Horario de Visitas</span>
                            </div>
                            <span class="value">${data.preferencias.horario_visitas}</span>
                        </div>
                    ` : ''}
                </div>
                ${data.preferencias?.reglas_casa ? `
                    <div class="reglas-casa">
                        <h4>Reglas de la Casa</h4>
                        <p>${data.preferencias.reglas_casa}</p>
                    </div>
                ` : ''}
            </div>

            <div class="contact-section">
                <button class="btn-contact">
                    <i class="fas fa-envelope"></i>
                    Contactar Arrendador
                </button>
                <button class="btn-apply">
                    <i class="fas fa-file-alt"></i>
                    Postular
                </button>
            </div>
        `;

        // Asegurarse que el botón de postular tenga el ID
        const btnApply = expandedView.querySelector('.btn-apply');
        if (btnApply) {
            btnApply.dataset.publicationId = publicacionId;
        }

        // Después de actualizar el contenido, inicializar los botones
        initPostularButtons();
        
        // Mostrar el modal
        document.body.classList.add('modal-open');
        expandedView.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
    });
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

function mostrarFormularioPostulacion(publicacionId) {
    console.log('Intentando mostrar formulario para publicación:', publicacionId); // Debug
    
    // Cerrar la ventana de descripción
    const expandedView = document.getElementById('expandedView');
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

function cerrarFormularioModal() {
    const modal = document.getElementById('formularioModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
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
            cerrarFormularioModal();
            showNotification('Éxito', 'Formulario enviado correctamente');
        } else {
            showNotification('Error', data.message || 'Error al enviar el formulario');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al enviar el formulario');
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
