document.addEventListener('DOMContentLoaded', function() {
    // Manejo de documentos
    const docInput = document.getElementById('documento');
    if (docInput) {
        docInput.addEventListener('change', function(e) {
            const preview = document.getElementById('document-preview');
            const file = this.files[0];
            
            // Validar el tamaño y tipo de archivo
            const validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!validTypes.includes(file.type)) {
                alert('El archivo debe ser PDF o Word');
                this.value = '';
                return;
            }
            
            if (file.size > maxSize) {
                alert('El archivo es demasiado grande. El tamaño máximo es 5MB');
                this.value = '';
                return;
            }

            // Mostrar preview del documento
            preview.innerHTML = '';
            const div = document.createElement('div');
            div.className = 'document-container';
            div.innerHTML = `
                <div class="document-info">
                    <i class="fas ${file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-word'}"></i>
                    <span>${file.name}</span>
                </div>
                <button type="button" class="delete-document" onclick="removeDocument(this)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.appendChild(div);
        });
    }

    // Función global para eliminar documento
    window.removeDocument = function(button) {
        const container = button.closest('.document-container');
        container.remove();
        
        // Limpiar el input de archivo
        const input = document.getElementById('documento');
        input.value = '';
    };

    // Eliminar documento existente
    const deleteDocButton = document.querySelector('.delete-document[data-doc-id]');
    if (deleteDocButton) {
        deleteDocButton.addEventListener('click', function() {
            const docId = this.dataset.docId;
            if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                
                fetch(`/perfil/eliminar-documento/${docId}/`, {
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
                        const docContainer = document.getElementById('doc-container');
                        if (docContainer) {
                            docContainer.remove();
                            // Limpiar el input de archivo
                            const input = document.getElementById('documento');
                            input.value = '';
                        }
                    } else {
                        throw new Error(data.error || 'Error al eliminar el documento');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(error.message || 'Error al eliminar el documento');
                });
            }
        });
    }

    // Drag and drop para documentos
    const dropZone = document.querySelector('.file-upload');
    if (dropZone) {
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
            if (files.length > 0) {
                const input = document.getElementById('documento');
                input.files = files;
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        });
    }
}); 