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
