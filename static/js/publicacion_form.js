document.addEventListener('DOMContentLoaded', function() {
    const formatNumber = (num) => {
        if (!num) return '';
        let value = num.toString().replace(/[^\d]/g, '');
        let parts = [];
        while (value.length > 0) {
            parts.unshift(value.slice(-3));
            value = value.slice(0, -3);
        }
        return parts.join('.');
    };

    const rentalInput = document.getElementById('rental-value');
    
    if (rentalInput) {
        // Prevenir el pegado de texto no numérico
        rentalInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            if (/^\d*$/.test(text)) {
                const formattedValue = formatNumber(text);
                this.value = formattedValue;
            }
        });

        // Prevenir la entrada de caracteres no numéricos
        rentalInput.addEventListener('keypress', function(e) {
            if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
        });

        // Formatear mientras se escribe
        rentalInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            
            if (value) {
                const formattedValue = formatNumber(value);
                this.value = formattedValue;
            }
        });

        // Formatear el valor inicial si existe
        if (rentalInput.value) {
            rentalInput.value = formatNumber(rentalInput.value);
        }
    }

    // Al enviar el formulario, quitar los puntos
    const form = document.getElementById('publicacionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (rentalInput) {
                const value = rentalInput.value.replace(/\./g, '');
                rentalInput.value = value;
            }
        });
    }

    // Previsualización de imágenes
    const photosInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview');

    if (photosInput) {
        photosInput.addEventListener('change', function() {
            previewContainer.innerHTML = ''; // Limpiar previsualizaciones anteriores
            
            Array.from(this.files).forEach(file => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const div = document.createElement('div');
                    div.className = 'image-container';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    
                    div.appendChild(img);
                    previewContainer.appendChild(div);
                }
                
                reader.readAsDataURL(file);
            });
        });
    }

    // Eliminación de fotos existentes
    document.querySelectorAll('.delete-image').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const fotoId = this.getAttribute('data-foto-id');
            const container = document.getElementById(`foto-${fotoId}`);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            fetch(`/publicaciones/eliminar-foto/${fotoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    container.remove();
                } else {
                    alert('Error al eliminar la imagen');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al eliminar la imagen');
            });
        });
    });
}); 