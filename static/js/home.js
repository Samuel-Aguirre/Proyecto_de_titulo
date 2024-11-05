// Función para alternar el menú de navegación en pantallas pequeñas
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

function recomendarRegistro(){
    Swal.fire({
        title: '¿Está Seguro?',
        text: "No Podrás Deshacer Está Acción!🤨",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!',
        cancelButtonText: 'Cancelar'
      })
}