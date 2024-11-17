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
}); 