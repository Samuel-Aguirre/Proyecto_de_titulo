document.addEventListener('DOMContentLoaded', function() {
    initializeResenas();
});

function initializeResenas() {
    // Inicializar tooltips si los hay
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Manejar eliminación de reseñas
    const deleteButtons = document.querySelectorAll('.btn-delete-resena');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const resenaId = this.dataset.resenaId;
            confirmarEliminarResena(resenaId);
        });
    });
}

function confirmarEliminarResena(resenaId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarResena(resenaId);
        }
    });
}

function eliminarResena(resenaId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/resenas/${resenaId}/eliminar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Eliminada',
                text: 'La reseña ha sido eliminada correctamente',
                icon: 'success'
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.error || 'Error al eliminar la reseña');
        }
    })
    .catch(error => {
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al eliminar la reseña',
            icon: 'error'
        });
    });
}

function editarResena(resenaId) {
    // Obtener la información actual de la reseña
    const resenaCard = document.querySelector(`[data-resena-id="${resenaId}"]`);
    const puntuacionActual = resenaCard.querySelector('.rating').dataset.rating;
    const comentarioActual = resenaCard.querySelector('.review-text').textContent;

    Swal.fire({
        title: 'Editar Reseña',
        html: `
            <div class="rating-container">
                <div class="stars">
                    <i class="far fa-star" data-value="1"></i>
                    <i class="far fa-star" data-value="2"></i>
                    <i class="far fa-star" data-value="3"></i>
                    <i class="far fa-star" data-value="4"></i>
                    <i class="far fa-star" data-value="5"></i>
                </div>
            </div>
            <textarea id="comentarioResena" class="swal2-textarea">${comentarioActual}</textarea>
        `,
        didRender: () => {
            // Inicializar estrellas con el valor actual
            const stars = document.querySelectorAll('.stars i');
            stars.forEach(star => {
                if (star.dataset.value <= puntuacionActual) {
                    star.classList.remove('far');
                    star.classList.add('fas');
                    star.classList.add('selected');
                }

                star.addEventListener('mouseover', function() {
                    const value = this.dataset.value;
                    stars.forEach(s => {
                        if (s.dataset.value <= value) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                        } else {
                            s.classList.remove('fas');
                            s.classList.add('far');
                        }
                    });
                });

                star.addEventListener('click', function() {
                    stars.forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const puntuacion = document.querySelector('.stars i.selected')?.dataset.value;
            const comentario = document.getElementById('comentarioResena').value;

            if (!puntuacion) {
                Swal.showValidationMessage('Por favor, selecciona una puntuación');
                return false;
            }
            if (!comentario.trim()) {
                Swal.showValidationMessage('Por favor, escribe un comentario');
                return false;
            }

            return { puntuacion, comentario };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            actualizarResena(resenaId, result.value.puntuacion, result.value.comentario);
        }
    });
}

function crearResena(arrendadorId, publicacionId) {
    console.log('Creando reseña para:', { arrendadorId, publicacionId });  // Debug log
    
    Swal.fire({
        title: 'Dejar Reseña',
        html: `
            <div class="rating-container">
                <div class="stars">
                    <i class="far fa-star" data-value="1"></i>
                    <i class="far fa-star" data-value="2"></i>
                    <i class="far fa-star" data-value="3"></i>
                    <i class="far fa-star" data-value="4"></i>
                    <i class="far fa-star" data-value="5"></i>
                </div>
            </div>
            <textarea id="comentarioResena" class="swal2-textarea" 
                      placeholder="Escribe tu reseña aquí..."></textarea>
        `,
        didRender: () => {
            // Inicializar el sistema de estrellas
            const stars = document.querySelectorAll('.stars i');
            stars.forEach(star => {
                star.addEventListener('mouseover', function() {
                    const value = this.dataset.value;
                    stars.forEach(s => {
                        if (s.dataset.value <= value) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                        } else {
                            s.classList.remove('fas');
                            s.classList.add('far');
                        }
                    });
                });
                
                star.addEventListener('click', function() {
                    stars.forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
        },
        showCancelButton: true,
        confirmButtonText: 'Enviar Reseña',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const puntuacion = document.querySelector('.stars i.selected')?.dataset.value;
            const comentario = document.getElementById('comentarioResena').value;
            
            if (!puntuacion) {
                Swal.showValidationMessage('Por favor, selecciona una puntuación');
                return false;
            }
            if (!comentario.trim()) {
                Swal.showValidationMessage('Por favor, escribe un comentario');
                return false;
            }
            
            return { puntuacion, comentario };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('Datos de reseña:', result.value);  // Debug log
            enviarResena(arrendadorId, result.value.puntuacion, result.value.comentario, publicacionId);
        }
    });
}

function enviarResena(arrendadorId, puntuacion, comentario, publicacionId) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(`/resenas/crear/${arrendadorId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            puntuacion: parseInt(puntuacion),
            comentario: comentario,
            publicacion_id: publicacionId
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error al enviar la reseña');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Éxito',
                text: 'Reseña enviada correctamente',
                icon: 'success'
            }).then(() => {
                window.location.reload();
            });
        } else {
            throw new Error(data.error || 'Error al enviar la reseña');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al enviar la reseña',
            icon: 'error'
        });
    });
} 