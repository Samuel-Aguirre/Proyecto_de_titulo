document.addEventListener('DOMContentLoaded', function() {
    // Manejo de tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar el botón clickeado y su contenido correspondiente
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Formulario de información personal
    const personalForm = document.getElementById('personal-info-form');
    personalForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('accion', 'actualizar_personal');
        
        // Validar campos requeridos
        const requiredFields = ['nombre', 'apellido', 'email'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = this.querySelector(`[name="${field}"]`);
            if (!input.value.trim()) {
                showToast('Error', `El campo ${field} es requerido`, 'error');
                input.classList.add('invalid');
                isValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!isValid) return;

        // Validar formato de email
        const emailInput = this.querySelector('[name="email"]');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showToast('Error', 'El formato del email no es válido', 'error');
            return;
        }

        // Validar formato de teléfono
        const phoneInput = this.querySelector('[name="telefono_contacto"]');
        if (phoneInput.value && !phoneInput.value.match(/^[+]?[0-9]{8,15}$/)) {
            showToast('Error', 'El formato del teléfono no es válido', 'error');
            return;
        }
        
        fetch('/configuracion/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Éxito', data.message, 'success');
                // Actualizar nombre en el navbar si existe
                const navbarName = document.querySelector('.user-name');
                if (navbarName) {
                    navbarName.textContent = `${formData.get('nombre')} ${formData.get('apellido').charAt(0)}.`;
                }
            } else {
                showToast('Error', data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', 'Ocurrió un error al actualizar la información', 'error');
        });
    });

    // Formulario de seguridad
    const securityForm = document.getElementById('security-form');
    securityForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('accion', 'cambiar_password');
        
        // Validar contraseñas
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        if (newPassword.length < 8) {
            showToast('Error', 'La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }
        
        fetch('/configuracion/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Éxito', data.message, 'success');
                this.reset();
                // Redirigir al login después de un breve delay
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
            } else {
                showToast('Error', data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', 'Ocurrió un error al cambiar la contraseña', 'error');
        });
    });
});

// Función para confirmar eliminación de cuenta
function confirmarEliminarCuenta() {
    Swal.fire({
        title: '¿Estás seguro de eliminar tu cuenta?',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 0.5rem; font-size: 0.9rem;">
                    Esta acción eliminará permanentemente:
                </p>
                <ul>
                    <li>Tu cuenta de usuario y acceso</li>
                    <li>Tu información personal</li>
                    <li>Tus publicaciones</li>
                    <li>Tu historial completo</li>
                </ul>
                <div style="background: rgba(220, 53, 69, 0.1); border-radius: 6px; padding: 1rem; margin-top: 0.75rem;">
                    <p style="color: var(--danger); font-weight: 500; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        Para confirmar, escribe "eliminar":
                    </p>
                    <input type="text" id="confirmDelete" class="swal2-input" placeholder="eliminar">
                </div>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar cuenta',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#f1f3f5',
        customClass: {
            popup: 'swal2-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            icon: 'swal2-icon',
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel',
            actions: 'swal2-actions'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('accion', 'eliminar_cuenta');
            
            fetch('/configuracion/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Cuenta Eliminada',
                        text: 'Tu cuenta ha sido eliminada permanentemente',
                        icon: 'success',
                        confirmButtonColor: '#2E7D32'
                    }).then(() => {
                        window.location.href = '/';
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: data.message || 'Ocurrió un error al eliminar la cuenta',
                        icon: 'error',
                        confirmButtonColor: '#2E7D32'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un error al eliminar la cuenta',
                    icon: 'error',
                    confirmButtonColor: '#2E7D32'
                });
            });
        }
    });
}

// Función para mostrar mensajes toast
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-times-circle' : 
                          'fa-info-circle'}"></i>
            <div class="toast-message">
                <span class="toast-title">${title}</span>
                <span class="toast-text">${message}</span>
            </div>
        </div>
        <div class="toast-progress"></div>
    `;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
} 