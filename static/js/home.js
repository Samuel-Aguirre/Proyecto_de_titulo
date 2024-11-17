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
    Swal.fire({
        title: '¡Únete a ArrendaU!',
        text: "Para acceder a todas las funcionalidades, necesitas crear una cuenta.",
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