// Función para validar los campos del formulario de registro
function validarFormulario() {
    // Obtener los valores de los campos de entrada
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const userType = document.getElementById("user_type").value;

    // Expresiones regulares
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{5,}$/;

    // Validaciones
    if (!nameRegex.test(nombre.trim())) {
        mostrarError("El nombre solo debe contener letras");
        return false;
    }

    if (!nameRegex.test(apellido.trim())) {
        mostrarError("El apellido solo debe contener letras");
        return false;
    }

    if (!emailRegex.test(email)) {
        mostrarError("Por favor, ingresa un correo electrónico válido");
        return false;
    }

    if (!passwordRegex.test(password)) {
        mostrarError("La contraseña debe tener al menos 5 caracteres, incluyendo letras y números");
        return false;
    }

    if (password !== confirmPassword) {
        mostrarError("Las contraseñas no coinciden");
        return false;
    }

    if (!userType) {
        mostrarError("Por favor, selecciona tu rol");
        return false;
    }

    return true;
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const alertaExistente = document.querySelector('.alert-error');
    if (alertaExistente) {
        alertaExistente.remove();
    }

    const alerta = document.createElement('div');
    alerta.className = 'alert alert-error';
    alerta.textContent = mensaje;

    const form = document.querySelector('.register-form');
    form.insertBefore(alerta, form.firstChild);

    // Remover la alerta después de 5 segundos
    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Toggle de visibilidad de contraseña
function togglePasswordVisibility(passwordId) {
    const passwordInput = document.getElementById(passwordId);
    const toggleButton = passwordInput.parentElement.querySelector('.toggle-password i');
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = "password";
        toggleButton.className = 'fas fa-eye';
    }
}

// Prevenir envío del formulario si hay errores
document.querySelector('.register-form').addEventListener('submit', function(event) {
    if (!validarFormulario()) {
        event.preventDefault();
    }
});

