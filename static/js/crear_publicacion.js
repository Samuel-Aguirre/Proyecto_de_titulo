// Código para añadir vistas previas de fotos y manejo dinámico de la subida de imágenes
document.getElementById('photo-upload').addEventListener('change', function(e) {
    const container = document.getElementById('photo-upload-container');
    const files = e.target.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = document.createElement('div');
        preview.className = 'photo-preview';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = function() {
            URL.revokeObjectURL(this.src); // Liberamos la memoria después de cargar la imagen
        };
        
        preview.appendChild(img);
        container.insertBefore(preview, container.lastElementChild);
    }
});

// Función para añadir un nuevo input de foto cuando se hace clic en el botón "+"
function addPhotoInput() {
    const container = document.getElementById('photo-upload-container');
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'photos';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const preview = document.createElement('div');
        preview.className = 'photo-preview';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = function() {
            URL.revokeObjectURL(this.src);
        };
        
        preview.appendChild(img);
        container.insertBefore(preview, container.lastElementChild);
    };
    
    input.click();
}