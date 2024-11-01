// Función para validar los campos del formulario de registro
function validarFormulario() {
    // Obtener los valores de los campos de entrada
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const userType = document.getElementById("user_type").value;

    // Expresión regular para validar el formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Expresión regular para validar que el nombre y apellido contengan solo letras y espacios
    const nameRegex = /^[a-zA-Z\s]+$/;
     // Expresión regular para validar que la contraseña tenga al menos 5 caracteres, incluyendo una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{5,}$/;

    // Validar el nombre completo
    if (!nameRegex.test(nombre)) {
        alert("Por favor, ingresa un nombre válido (solo letras y espacios).");
        return false;
    }

    // Validar el apellido
    if (!nameRegex.test(apellido)) {
        alert("Por favor, ingresa un apellido válido (solo letras y espacios).");
        return false;
    }

    // Validar el correo electrónico
    if (!emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        return false;
    }

    // Validar la contraseña
    if (!passwordRegex.test(password)) {
        alert("La contraseña debe tener al menos 5 caracteres, incluyendo letras y números.");
        return false;
    }

    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden. Por favor, verifica.");
        return false;
    }

    // Verificar que se haya seleccionado un rol de usuario
    if (!userType) {
        alert("Por favor, selecciona tu rol.");
        return false;
    }

    // Si todas las validaciones son correctas, permitir el envío del formulario
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
    const toggleIcon = document.querySelector(".toggle-password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.textContent = "🔓";
    } else {
        passwordInput.type = "password";
        toggleIcon.textContent = "🔒";
    }
}

