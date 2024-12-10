// Función para alternar el menú de navegación en pantallas pequeñas
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    const hamburger = document.querySelector('.hamburger');
    
    navLinks.classList.toggle('active');
    authButtons.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function recomendarRegistro() {
    window.location.href = '/dashboard/';
}

// Cerrar el menú al hacer clic fuera de él
document.addEventListener('click', function(e) {
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    const hamburger = document.querySelector('.hamburger');
    
    if (navLinks.classList.contains('active') && 
        !e.target.closest('.nav-links') && 
        !e.target.closest('.hamburger')) {
        navLinks.classList.remove('active');
        authButtons.classList.remove('active');
        hamburger.classList.remove('active');
    }
});