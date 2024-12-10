document.addEventListener('DOMContentLoaded', function() {
    // Menú hamburguesa
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.au-nav-links');
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    }

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Notificaciones
    const notifButton = document.querySelector('.notifications-button');
    const notifContent = document.querySelector('.notifications-content');
    let isNotifOpen = false;

    notifButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        isNotifOpen = !isNotifOpen;
        notifContent.classList.toggle('show-mobile');
        
        // Cerrar perfil si está abierto
        if (profileContent.classList.contains('show-mobile')) {
            profileContent.classList.remove('show-mobile');
            isProfileOpen = false;
        }
    });

    // Perfil dropdown
    const profileButton = document.querySelector('.profile-button');
    const profileContent = document.querySelector('.dropdown-content');
    let isProfileOpen = false;

    profileButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        isProfileOpen = !isProfileOpen;
        profileContent.classList.toggle('show-mobile');
        
        // Cerrar notificaciones si están abiertas
        if (notifContent.classList.contains('show-mobile')) {
            notifContent.classList.remove('show-mobile');
            isNotifOpen = false;
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', () => {
        if (isMenuOpen) toggleMenu();
        if (isNotifOpen) {
            notifContent.classList.remove('show-mobile');
            isNotifOpen = false;
        }
        if (isProfileOpen) {
            profileContent.classList.remove('show-mobile');
            isProfileOpen = false;
        }
    });

    // Prevenir cierre al hacer click dentro
    notifContent?.addEventListener('click', e => e.stopPropagation());
    profileContent?.addEventListener('click', e => e.stopPropagation());

    // Función para verificar notificaciones
    function checkNotifications() {
        fetch('/publicaciones/notificaciones/')
            .then(response => response.json())
            .then(data => {
                const notifCount = document.querySelector('.notifications-count');
                const notifList = document.querySelector('.notifications-list');
                const noNotifMessage = document.querySelector('.no-notifications');

                if (data.notificaciones.length > 0) {
                    notifCount.textContent = data.notificaciones.length;
                    notifCount.style.display = 'flex';

                    if (noNotifMessage) noNotifMessage.remove();
                    notifList.innerHTML = '';
                    
                    data.notificaciones.forEach(notif => {
                        const notifElement = document.createElement('div');
                        notifElement.className = 'notification-item';
                        notifElement.dataset.notificationId = notif.id;
                        
                        // Determinar el icono y clase según el tipo de notificación
                        let iconClass, statusClass, title;
                        switch(notif.tipo) {
                            case 'ACEPTADO':
                                iconClass = 'fa-check-circle';
                                statusClass = 'text-success';
                                title = 'Postulación Aceptada';
                                break;
                            case 'RECHAZADO':
                                iconClass = 'fa-times-circle';
                                statusClass = 'text-danger';
                                title = 'Postulación Rechazada';
                                break;
                            case 'CANCELADO':
                                iconClass = 'fa-undo';
                                statusClass = 'text-warning';
                                title = 'Postulación en Revisión';
                                break;
                            default:
                                iconClass = 'fa-info-circle';
                                statusClass = 'text-info';
                                title = 'Notificación';
                        }
                        
                        notifElement.innerHTML = `
                            <div class="notification-content">
                                <i class="fas ${iconClass} ${statusClass}"></i>
                                <div class="notification-text">
                                    <strong>${title}</strong>
                                    <p>${notif.mensaje}</p>
                                    <small>${notif.fecha}</small>
                                </div>
                                <button class="notification-close" onclick="closeNotification(${notif.id}, this)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                        
                        notifList.appendChild(notifElement);
                    });
                } else {
                    notifCount.style.display = 'none';
                    notifList.innerHTML = '<p class="no-notifications">No hay notificaciones nuevas</p>';
                }
            });
    }

    // Función para cerrar notificación
    window.closeNotification = function(notificationId, button) {
        const notifElement = button.closest('.notification-item');
        const notifCount = document.querySelector('.notifications-count');
        const notifList = document.querySelector('.notifications-list');
        
        // Marcar como leída en el servidor
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        fetch(`/publicaciones/notificacion/${notificationId}/marcar-leida/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        }).then(() => {
            // Remover la notificación de la UI
            notifElement.remove();
            
            // Actualizar contador
            const currentCount = parseInt(notifCount.textContent) - 1;
            if (currentCount > 0) {
                notifCount.textContent = currentCount;
            } else {
                notifCount.style.display = 'none';
                notifList.innerHTML = '<p class="no-notifications">No hay notificaciones nuevas</p>';
            }
        });
    };

    // Verificar notificaciones cada 30 segundos
    setInterval(checkNotifications, 30000);

    // Verificar notificaciones al cargar la página
    checkNotifications();

    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Crear el icono según el tipo
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        let iconContent = '';
        switch(type) {
            case 'success':
                iconContent = '<i class="fas fa-check"></i>';
                break;
            case 'error':
                iconContent = '<i class="fas fa-times"></i>';
                break;
            case 'warning':
                iconContent = '<i class="fas fa-exclamation"></i>';
                break;
            case 'info':
                iconContent = '<i class="fas fa-info"></i>';
                break;
        }
        icon.innerHTML = iconContent;
        
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'toast-title';
        titleElement.textContent = title;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';
        messageElement.textContent = message;
        
        content.appendChild(titleElement);
        if (message) content.appendChild(messageElement);
        
        toast.appendChild(icon);
        toast.appendChild(content);
        
        container.appendChild(toast);
        
        // Reducimos el tiempo de visualización a 3 segundos (3000ms)
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            // Reducimos el tiempo de la animación de salida a 200ms
            setTimeout(() => {
                container.removeChild(toast);
            }, 200);
        }, 3000);  // Cambiado de 5000 a 3000
    }

    // Modificar cómo se procesan los mensajes de Django
    const messages = document.querySelectorAll('.messages .alert');
    messages.forEach(message => {
        const type = message.classList.contains('alert-success') ? 'success' :
                    message.classList.contains('alert-error') ? 'error' :
                    message.classList.contains('alert-warning') ? 'warning' : 'info';
        
        // Extraer título y mensaje si existe un separador
        const content = message.textContent.split(':');
        const title = content[0].trim();
        const msg = content.length > 1 ? content[1].trim() : '';
        
        showToast(title, msg, type);
        message.remove();
    });
}); 