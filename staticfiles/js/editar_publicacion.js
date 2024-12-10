// Preview de imágenes
document.getElementById('photos').addEventListener('change', function(e) {
    const preview = document.getElementById('preview');
    const files = Array.from(this.files);
    
    // Validar el tamaño y tipo de archivo
    const validFiles = files.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            alert(`El archivo ${file.name} no es una imagen válida`);
            return false;
        }
        
        if (file.size > maxSize) {
            alert(`El archivo ${file.name} es demasiado grande. El tamaño máximo es 5MB`);
            return false;
        }
        
        return true;
    });

    // Mostrar preview de las imágenes válidas
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'image-container';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="delete-image" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
});

// Eliminar imagen existente
function deleteImage(photoId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        fetch(`/publicaciones/eliminar-foto/${photoId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const imageContainer = document.getElementById(`foto-${photoId}`);
                if (imageContainer) {
                    imageContainer.remove();
                }
            } else {
                throw new Error(data.error || 'Error al eliminar la imagen');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar la imagen');
        });
    }
}

// Drag and drop
const dropZone = document.querySelector('.file-upload');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
    dropZone.style.backgroundColor = 'rgba(46, 125, 50, 0.05)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#e0e0e0';
    dropZone.style.backgroundColor = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#e0e0e0';
    dropZone.style.backgroundColor = 'transparent';
    
    const files = e.dataTransfer.files;
    document.getElementById('photos').files = files;
    const event = new Event('change');
    document.getElementById('photos').dispatchEvent(event);
});

// Función para redirigir
function redirectTo(url) {
    window.location.href = url;
}
