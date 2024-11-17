document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide messages after 5 seconds
    const messages = document.querySelectorAll('.alert');
    messages.forEach(message => {
        setTimeout(() => {
            message.remove();
        }, 5000);
    });
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
    console.log('Mostrando notificación:', title, message);
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

    // Auto-ocultar la notificación después de 3 segundos
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

function confirmDelete() {
    if (!publicacionIdToDelete) {
        console.error('No hay ID de publicación para eliminar');
        showNotification('Error', 'No se encontró la publicación a eliminar');
        return;
    }

    console.log('Eliminando publicación:', publicacionIdToDelete);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/publicaciones/eliminar/${publicacionIdToDelete}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(async response => {
        if (response.ok) {
            const publicacionCard = document.querySelector(`[data-publication-id="${publicacionIdToDelete}"]`);
            if (publicacionCard) {
                publicacionCard.style.opacity = '0';
                setTimeout(() => {
                    publicacionCard.remove();
                    // Verificar si no hay más publicaciones
                    const remainingCards = document.querySelectorAll('.property-card');
                    if (remainingCards.length === 0) {
                        const listings = document.querySelector('.listings');
                        listings.innerHTML = `
                            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                <p>No has creado ninguna publicación aún.</p>
                                <a href="/publicaciones/crear/" class="btn-create" style="margin-top: 1rem;">
                                    Crear mi primera publicación
                                </a>
                            </div>
                        `;
                    }
                }, 300);
            }
            hideDeleteModal();
            showNotification('Éxito', 'Publicación eliminada exitosamente');
        } else {
            throw new Error('Error al eliminar la publicación');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideDeleteModal();
        showNotification('Error', 'Hubo un error al eliminar la publicación. Por favor, intenta nuevamente.');
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
