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

    // Definir las funciones en el objeto window
    window.agregarPregunta = function() {
        const container = document.getElementById('preguntas-container');
        const template = container.querySelector('.pregunta-template');
        const nuevaPregunta = template.cloneNode(true);
        
        nuevaPregunta.style.display = 'block';
        nuevaPregunta.classList.remove('pregunta-template');
        
        // Actualizar el número de la pregunta (corregido)
        const numPreguntas = container.querySelectorAll('.pregunta-grupo:not(.pregunta-template)').length;
        nuevaPregunta.querySelector('.pregunta-numero').textContent = numPreguntas + 1;
        
        // Limpiar las opciones de respuesta existentes
        const respuestasList = nuevaPregunta.querySelector('.respuestas-list');
        respuestasList.innerHTML = '';
        
        // Limpiar el select de respuesta esperada
        const respuestaEsperadaSelect = nuevaPregunta.querySelector('.respuesta-esperada-select');
        respuestaEsperadaSelect.innerHTML = '<option value="">Seleccione la respuesta esperada</option>';
        
        container.appendChild(nuevaPregunta);
    };

    window.agregarOpcionRespuesta = function(button) {
        const preguntaGrupo = button.closest('.pregunta-grupo');
        const respuestasList = preguntaGrupo.querySelector('.respuestas-list');
        const respuestaEsperadaSelect = preguntaGrupo.querySelector('.respuesta-esperada-select');
        
        const respuestaDiv = document.createElement('div');
        respuestaDiv.className = 'respuesta-opcion';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control respuesta-input';
        input.placeholder = 'Escribe una opción de respuesta';
        // Generar un ID único para el input
        input.id = 'respuesta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete-respuesta';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = function() {
            const valor = input.value;
            respuestaDiv.remove();
            // Eliminar la opción del select de respuesta esperada
            const option = respuestaEsperadaSelect.querySelector(`option[data-input-id="${input.id}"]`);
            if (option) option.remove();
        };
        
        // Actualizar el select de respuesta esperada cuando se modifique el input
        input.addEventListener('input', function() {
            const valor = this.value;
            if (valor.trim() === '') return; // No agregar opciones vacías
            
            let optionExistente = respuestaEsperadaSelect.querySelector(`option[data-input-id="${this.id}"]`);
            
            if (optionExistente) {
                optionExistente.textContent = valor;
                optionExistente.value = valor;
            } else {
                const option = document.createElement('option');
                option.value = valor;
                option.textContent = valor;
                option.dataset.inputId = this.id;
                respuestaEsperadaSelect.appendChild(option);
            }
        });
        
        respuestaDiv.appendChild(input);
        respuestaDiv.appendChild(deleteBtn);
        respuestasList.appendChild(respuestaDiv);
    };

    window.eliminarPregunta = function(button) {
        const preguntaGrupo = button.closest('.pregunta-grupo');
        preguntaGrupo.remove();
        
        // Actualizar números de preguntas
        const container = document.getElementById('preguntas-container');
        const preguntas = container.querySelectorAll('.pregunta-grupo:not(.pregunta-template)');
        preguntas.forEach((pregunta, index) => {
            pregunta.querySelector('.pregunta-numero').textContent = index + 1;
        });
    };

    // Inicializar los eventos de las respuestas existentes
    document.querySelectorAll('.respuesta-input').forEach(input => {
        const preguntaGrupo = input.closest('.pregunta-grupo');
        const respuestaEsperadaSelect = preguntaGrupo.querySelector('.respuesta-esperada-select');
        
        input.addEventListener('input', function() {
            const valor = this.value;
            if (valor.trim() === '') return;
            
            let optionExistente = respuestaEsperadaSelect.querySelector(`option[data-input-id="${this.id}"]`);
            
            if (optionExistente) {
                optionExistente.textContent = valor;
                optionExistente.value = valor;
            } else {
                const option = document.createElement('option');
                option.value = valor;
                option.textContent = valor;
                option.dataset.inputId = this.id;
                respuestaEsperadaSelect.appendChild(option);
            }
        });
    });

    // Agregar primera pregunta solo si no hay preguntas existentes
    const container = document.getElementById('preguntas-container');
    if (container && !container.querySelector('.pregunta-grupo:not(.pregunta-template)')) {
        window.agregarPregunta();
    }

    // Modificar el evento submit del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            const preguntas = [];
            const respuestasOpciones = [];
            const respuestasEsperadas = [];
            
            this.querySelectorAll('.pregunta-grupo:not(.pregunta-template)').forEach(grupo => {
                const pregunta = grupo.querySelector('.pregunta-input').value;
                const opciones = Array.from(grupo.querySelectorAll('.respuesta-input')).map(input => input.value);
                const respuestaEsperada = grupo.querySelector('.respuesta-esperada-select').value;
                
                if (pregunta.trim() && opciones.length > 0) {
                    preguntas.push(pregunta);
                    respuestasOpciones.push(opciones);
                    respuestasEsperadas.push(respuestaEsperada);
                }
            });
            
            const preguntasInput = document.createElement('input');
            preguntasInput.type = 'hidden';
            preguntasInput.name = 'preguntas_compatibilidad';
            preguntasInput.value = JSON.stringify({
                preguntas: preguntas,
                opciones: respuestasOpciones,
                respuestas_esperadas: respuestasEsperadas
            });
            
            this.appendChild(preguntasInput);
        });
    }
}); 