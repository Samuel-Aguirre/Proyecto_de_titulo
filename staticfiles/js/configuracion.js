document.addEventListener('DOMContentLoaded', function() {
    // Formulario de información personal
    const personalForm = document.getElementById('personal-info-form');
    personalForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('accion', 'actualizar_personal');
        
        fetch('/configuracion/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Éxito', data.message, 'success');
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
        
        fetch('/configuracion/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Éxito', data.message, 'success');
                this.reset();
            } else {
                showToast('Error', data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', 'Ocurrió un error al cambiar la contraseña', 'error');
        });
    });

    // Formulario de notificaciones
    const notificationsForm = document.getElementById('notifications-form');
    notificationsForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('accion', 'actualizar_notificaciones');
        formData.append('email_notifications', this.email_notifications.checked);
        formData.append('new_postulations', this.new_postulations.checked);
        formData.append('status_updates', this.status_updates.checked);
        
        fetch('/configuracion/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Éxito', data.message, 'success');
            } else {
                showToast('Error', data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Error', 'Ocurrió un error al actualizar las preferencias', 'error');
        });
    });
});

function confirmarEliminarCuenta() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar cuenta',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('accion', 'eliminar_cuenta');
            
            fetch('/configuracion/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        'Cuenta eliminada',
                        data.message,
                        'success'
                    ).then(() => {
                        window.location.href = data.redirect;
                    });
                } else {
                    Swal.fire(
                        'Error',
                        data.message,
                        'error'
                    );
                }
            })
            .catch(error => {
                Swal.fire(
                    'Error',
                    'Ocurrió un error al eliminar la cuenta',
                    'error'
                );
            });
        }
    });
} 