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

    // Al enviar el formulario
    const form = document.getElementById('publicacionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Limpiar el valor del alquiler antes de enviar
            if (rentalInput) {
                const value = rentalInput.value.replace(/\./g, '');
                rentalInput.value = value;
            }

            // Verificar si estamos editando o creando
            const isEditing = form.getAttribute('data-editing') === 'true';

            if (!isEditing) {
                // Solo mostrar modal de pago si es una nueva publicación
                Swal.fire({
                    title: 'Publicación con Costo',
                    html: `
                        <p>Para publicar tu anuncio, es necesario realizar un pago de $5.000 CLP.</p>
                        <p>Este pago es único por publicación y te permite:</p>
                        <ul style="text-align: left;">
                            <li>Mantener tu publicación activa</li>
                            <li>Recibir postulaciones de arrendatarios</li>
                            <li>Acceder a estadísticas de tu publicación</li>
                        </ul>
                    `,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Proceder al pago',
                    cancelButtonText: 'Cancelar',
                    reverseButtons: true,
                    customClass: {
                        confirmButton: 'swal-confirm-button',
                        cancelButton: 'swal-cancel-button'
                    },
                    buttonsStyling: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        enviarFormulario(form, true);
                    } else {
                        // Restaurar formato con puntos
                        if (rentalInput) {
                            rentalInput.value = formatNumber(value);
                        }
                    }
                });
            } else {
                // Si es edición, enviar directamente
                enviarFormulario(form, false);
            }
        });
    }

    // Función para enviar el formulario
    function enviarFormulario(form, esNueva) {
        // Limpiar el valor del alquiler
        if (rentalInput) {
            const value = rentalInput.value.replace(/\./g, '');
            rentalInput.value = value;
        }

        // Preparar el formulario de compatibilidad
        prepararFormularioCompatibilidad(form);
        
        // Preparar los datos del formulario
        const formData = new FormData(form);
        
        // Enviar el formulario mediante AJAX
        fetch(form.action, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json().catch(() => {
                throw new Error('Error al procesar la respuesta JSON');
            });
        })
        .then(data => {
            if (data.success) {
                if (esNueva) {
                    // Iniciar el proceso de pago solo si es nueva publicación
                    procesarPago(data.publicacion_id);
                } else {
                    // Si es edición, mostrar mensaje de éxito y redireccionar
                    Swal.fire({
                        title: 'Éxito',
                        text: 'Publicación actualizada correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                            confirmButton: 'swal-confirm-button'
                        },
                        buttonsStyling: false
                    }).then(() => {
                        window.location.href = form.getAttribute('data-redirect-url') || '/dashboard/';
                    });
                }
            } else {
                throw new Error(data.error || 'Error al procesar la publicación');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'Hubo un error al procesar tu solicitud',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                customClass: {
                    confirmButton: 'swal-confirm-button'
                },
                buttonsStyling: false
            });
            // Restaurar el formato con puntos
            if (rentalInput) {
                const originalValue = rentalInput.value;
                rentalInput.value = formatNumber(originalValue);
            }
        });
    }

    // Previsualización de imágenes
    const photosInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview');

    if (photosInput) {
        photosInput.addEventListener('change', function() {
            previewContainer.innerHTML = ''; // Limpiar previsualizaciones anteriores
            
            Array.from(this.files).forEach((file, index) => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const div = document.createElement('div');
                    div.className = 'image-container';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    
                    // Agregar botón de eliminar
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'delete-image';
                    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                    
                    // Función para eliminar la imagen
                    deleteBtn.onclick = function() {
                        div.remove();
                        
                        // Crear un nuevo FileList sin la imagen eliminada
                        const dt = new DataTransfer();
                        const { files } = photosInput;
                        
                        for (let i = 0; i < files.length; i++) {
                            if (i !== index) {
                                dt.items.add(files[i]);
                            }
                        }
                        
                        photosInput.files = dt.files;
                    };
                    
                    div.appendChild(img);
                    div.appendChild(deleteBtn);
                    previewContainer.appendChild(div);
                }
                
                reader.readAsDataURL(file);
            });
        });
    }

    // Mantener el código existente para eliminar fotos en modo edición
    document.querySelectorAll('.delete-image[data-foto-id]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const container = document.getElementById(`foto-${this.getAttribute('data-foto-id')}`);
            
            // Solo ocultar la imagen visualmente
            container.style.display = 'none';
            
            // Agregar un input hidden para marcar la imagen como eliminada
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'fotos_eliminar';
            hiddenInput.value = this.getAttribute('data-foto-id');
            document.getElementById('publicacionForm').appendChild(hiddenInput);
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

    // Agregar al final del archivo
    function procesarPago(publicacionId) {
        Swal.fire({
            title: 'Procesando',
            text: 'Iniciando proceso de pago...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch(`/pagos/iniciar/${publicacionId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'same-origin'
        })
        .then(async response => {
            const data = await response.json();
            console.log('Respuesta completa del servidor:', data); // Debug detallado
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la respuesta del servidor');
            }
            return data;
        })
        .then(data => {
            if (data.success && data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error(data.error || 'No se pudo iniciar el proceso de pago');
            }
        })
        .catch(error => {
            console.error('Error completo:', error); // Debug detallado
            Swal.fire({
                title: 'Error en el Proceso de Pago',
                text: error.message || 'Error al procesar el pago. Por favor, intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2E7D32',
                showCancelButton: true,
                cancelButtonText: 'Volver al Dashboard',
                reverseButtons: true
            }).then((result) => {
                if (!result.isConfirmed) {
                    window.location.href = '/dashboard/';
                }
            });
        });
    }

    function prepararFormularioCompatibilidad(form) {
        const preguntas = [];
        const respuestasOpciones = [];
        const respuestasEsperadas = [];
        
        form.querySelectorAll('.pregunta-grupo:not(.pregunta-template)').forEach(grupo => {
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
        
        form.appendChild(preguntasInput);
    }

    // Agregar estilos personalizados para los botones de SweetAlert2
    const style = document.createElement('style');
    style.textContent = `
        .swal-confirm-button {
            padding: 12px 24px;
            margin: 0 5px;
            background-color: #4CAF50 !important;
            color: white !important;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .swal-confirm-button:hover {
            background-color: #45a049 !important;
        }
        
        .swal-cancel-button {
            padding: 12px 24px;
            margin: 0 5px;
            background-color: #f44336 !important;
            color: white !important;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        
        .swal-cancel-button:hover {
            background-color: #da190b !important;
        }
    `;
    document.head.appendChild(style);

    // Función para iniciar el proceso de pago
    function iniciarProcesoPago(publicacionId) {
        mostrarCargando('Inicializando pago...');
        
        fetch(`/pagos/iniciar/${publicacionId}/`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            ocultarCargando();
            
            if (data.success && data.init_point) {
                // Redirigir al checkout de MercadoPago
                window.location.href = data.init_point;
            } else if (data.error) {
                // Mostrar error específico
                Swal.fire({
                    icon: 'error',
                    title: 'Error al iniciar el pago',
                    text: data.error,
                    confirmButtonText: 'Aceptar'
                });
            } else {
                // Error genérico
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al iniciar el proceso de pago. Por favor, intenta de nuevo.',
                    confirmButtonText: 'Aceptar'
                });
            }
        })
        .catch(error => {
            ocultarCargando();
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al conectar con el servidor. Por favor, intenta de nuevo.',
                confirmButtonText: 'Aceptar'
            });
        });
    }

    // Funciones auxiliares para mostrar/ocultar el indicador de carga
    function mostrarCargando(mensaje = 'Cargando...') {
        Swal.fire({
            title: mensaje,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    function ocultarCargando() {
        Swal.close();
    }
});