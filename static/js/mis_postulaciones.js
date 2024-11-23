document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide messages after 5 seconds
    const messages = document.querySelectorAll('.alert');
    messages.forEach(message => {
        setTimeout(() => {
            message.remove();
        }, 5000);
    });
});

let postulacionIdToDelete = null;

function eliminarPostulacion(postulacionId) {
    // Cerrar la ventana de descripción
    const expandedView = document.getElementById(`expandedView_${postulacionId}`);
    if (expandedView) {
        expandedView.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Mostrar el modal de confirmación
    showDeleteModal(postulacionId);
}

function showDeleteModal(postulacionId) {
    console.log('Mostrando modal para postulación:', postulacionId);
    postulacionIdToDelete = postulacionId;
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
        postulacionIdToDelete = null;
    }, 300);
}

function confirmDelete() {
    if (!postulacionIdToDelete) {
        console.log('No hay ID para eliminar');
        return;
    }

    const csrfToken = document.querySelector('#deleteForm [name=csrfmiddlewaretoken]').value;
    
    fetch(`/publicaciones/postulacion/${postulacionIdToDelete}/eliminar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
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
        const card = document.querySelector(`[data-postulation-id="${postulacionIdToDelete}"]`);
        if (card) {
            card.remove();
            const expandedView = document.querySelector(`[data-postulation-id="${postulacionIdToDelete}"].property-expanded`);
            if (expandedView) {
                expandedView.remove();
            }
        }
        hideDeleteModal();
        showNotification('Éxito', 'Postulación eliminada correctamente');
        
        // Si no quedan postulaciones, mostrar el estado vacío
        const listings = document.querySelector('.listings');
        if (!listings.querySelector('.property-card')) {
            listings.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list fa-3x"></i>
                    <h2>No tienes postulaciones activas</h2>
                    <p>Explora las propiedades disponibles y postula a las que te interesen.</p>
                    <a href="/dashboard" class="btn-explore">
                        Explorar Propiedades
                    </a>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideDeleteModal();
        showNotification('Error', 'No se pudo eliminar la postulación');
    });
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

function expandirPublicacion(postulacionId) {
    const expandedView = document.getElementById(`expandedView_${postulacionId}`);
    if (!expandedView) return;

    // Cerrar cualquier otra vista expandida que esté abierta
    document.querySelectorAll('.property-expanded').forEach(view => {
        if (view.id !== `expandedView_${postulacionId}`) {
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

function cambiarImagenPrincipal(nuevaSrc, postulacionId) {
    event.stopPropagation();
    const mainImage = document.querySelector(`#expandedView_${postulacionId} .main-image img`);
    if (mainImage) {
        mainImage.src = nuevaSrc;
        
        const miniaturas = document.querySelectorAll(`#expandedView_${postulacionId} .thumbnail-grid img`);
        miniaturas.forEach(img => {
            if (img.src === nuevaSrc) {
                img.classList.add('selected');
            } else {
                img.classList.remove('selected');
            }
        });
    }
}

// Cerrar modales al hacer clic fuera
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