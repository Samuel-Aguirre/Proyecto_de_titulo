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
}); 