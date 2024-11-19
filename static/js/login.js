// Validación del formulario
function validarFormulario() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        mostrarError("Por favor, ingresa un correo electrónico válido");
        return false;
    }

    if (password.trim() === "") {
        mostrarError("Por favor, ingresa una contraseña");
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

    const form = document.querySelector('.login-form');
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

// Modal de recuperación de contraseña
function showRecoveryForm() {
    const modal = document.getElementById('recoveryModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }   
}

function hideRecoveryForm() {
    const modal = document.getElementById('recoveryModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('recoveryModal');
    if (event.target === modal) {
        hideRecoveryForm();
    }
}

// Prevenir que el modal se cierre al hacer clic dentro
document.querySelector('.modal-content')?.addEventListener('click', function(event) {
    event.stopPropagation();
});

function flipCard() {
    const card = document.querySelector('.login-card');
    if (card) {
        card.style.transformStyle = 'preserve-3d';
        card.classList.toggle('flipped');
    }
}