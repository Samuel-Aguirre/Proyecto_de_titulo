// Función para validar los campos del formulario
function validarFormulario() {
    // Obtener los elementos de entrada por su ID
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Expresión regular para validar el formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validar el correo electrónico
    if (!emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        return false;
    }

    // Verificar que el campo de contraseña no esté vacío
    if (password.trim() === "") {
        alert("Por favor, ingresa una contraseña.");
        return false;
    }
 
    // Si todo es correcto, enviar el formulario
    return true;
}

// Función para alternar el menú de navegación en pantallas pequeñas
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Función para alternar la visibilidad de los campos de contraseña
function togglePasswordVisibility(passwordId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleIcon = passwordInput.parentElement.querySelector('.toggle-password');
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.add('password-visible');
    } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove('password-visible');
    }
}