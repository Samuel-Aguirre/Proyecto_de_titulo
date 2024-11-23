document.addEventListener('DOMContentLoaded', function() {
    // Manejo del input de archivo
    const documentoInput = document.getElementById('id_documento_estudiante');
    const documentoContainer = document.getElementById('documento-container');
    const documentoUpload = documentoContainer?.querySelector('.documento-upload');
    const documentoPreview = document.getElementById('documento-preview');

    if (documentoInput && documentoUpload) {
        // Ocultar input original
        documentoInput.style.display = 'none';

        // Manejar clic en el área de upload
        documentoUpload.addEventListener('click', () => documentoInput.click());

        // Manejar cambio de archivo
        documentoInput.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                mostrarPreviewDocumento(file);
            }
        });

        // Manejar drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            documentoUpload.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            documentoUpload.addEventListener(eventName, () => {
                documentoUpload.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            documentoUpload.addEventListener(eventName, () => {
                documentoUpload.classList.remove('drag-over');
            });
        });

        documentoUpload.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                documentoInput.files = e.dataTransfer.files;
                mostrarPreviewDocumento(file);
            }
        });
    }

    function mostrarPreviewDocumento(file) {
        if (!documentoPreview) return;

        documentoPreview.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <span class="file-name">${file.name}</span>
                <button type="button" class="remove-file">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Manejar eliminación del documento
        const removeButton = documentoPreview.querySelector('.remove-file');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                documentoInput.value = '';
                documentoPreview.innerHTML = '';
            });
        }
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Mostrar/ocultar campo de tipo de mascota según la selección
    const mascotaSelect = document.getElementById('id_mascota');
    const tipoMascotaGroup = document.getElementById('tipo_mascota_group');

    if (mascotaSelect && tipoMascotaGroup) {
        function toggleTipoMascota() {
            tipoMascotaGroup.style.display = 
                ['tengo', 'planeo'].includes(mascotaSelect.value) ? 'block' : 'none';
        }

        mascotaSelect.addEventListener('change', toggleTipoMascota);
        toggleTipoMascota(); // Estado inicial
    }

    const previewContainer = document.getElementById('documento-preview');

    if (documentoInput) {
        documentoInput.addEventListener('change', function() {
            previewContainer.innerHTML = ''; // Limpiar previsualizaciones anteriores
            
            Array.from(this.files).forEach(file => {
                const div = document.createElement('div');
                div.className = 'image-container';
                
                // Para documentos, mostrar un ícono en lugar de una imagen
                const icon = document.createElement('i');
                icon.className = 'fas fa-file-alt fa-3x';
                icon.style.color = '#4CAF50';
                
                const fileName = document.createElement('p');
                fileName.textContent = file.name;
                fileName.style.marginTop = '0.5rem';
                fileName.style.fontSize = '0.9rem';
                
                div.appendChild(icon);
                div.appendChild(fileName);
                previewContainer.appendChild(div);
            });
        });
    }

    // Añadir validación del formulario
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const preferenciaSelects = document.querySelectorAll('select[name^="pref_"]');
            let hasError = false;

            // Remover mensajes de error anteriores
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

            preferenciaSelects.forEach(select => {
                if (select.value === '0') {
                    e.preventDefault();
                    hasError = true;
                    
                    // Añadir clase de error al select
                    select.classList.add('error');
                    
                    // Crear y mostrar mensaje de error
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Por favor, seleccione una opción';
                    select.parentNode.appendChild(errorDiv);
                    
                    // Hacer scroll al primer error
                    if (hasError) {
                        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    this.classList.add('drag-over');
}

function unhighlight(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileSelect(files);
}

function handleFileSelect(files) {
    const documentoInput = document.getElementById('id_documento_estudiante');
    const previewContainer = document.getElementById('documento-preview');
    
    if (files.length > 0) {
        const file = files[0];
        documentoInput.files = files;
        
        // Mostrar nombre del archivo
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <span>${file.name}</span>
            <button type="button" class="remove-file">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Limpiar preview anterior
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.appendChild(fileInfo);
        }

        // Agregar funcionalidad para remover archivo
        const removeButton = fileInfo.querySelector('.remove-file');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                documentoInput.value = '';
                previewContainer.innerHTML = '';
            });
        }
    }
} 