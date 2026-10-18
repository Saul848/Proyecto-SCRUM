/**
 * Snippet JavaScript para alternar la selección:
 * Para que la clase .selected se active al hacer clic en un botón 
 * y desmarque los demás.
 */
document.querySelectorAll('.card-choice').forEach(button => {
    button.addEventListener('click', () => {
        // Remover la clase 'selected' de todas las cartas
        document.querySelectorAll('.card-choice').forEach(btn => btn.classList.remove('selected'));
        // Agregar la clase 'selected' a la carta cliqueada
        button.classList.add('selected');
    });
});


/**
 * Inicializa los controles de Planning Poker del desarrollador.
 * @param {HTMLElement} contenedor - Elemento que contiene el main de Planning Poker.
 */
function inicializarPlanningPokerDesarrollador(contenedor) {
    if (!contenedor) {
        console.error("No se encontró el contenedor de Planning Poker.");
        return;
    }

    // Información de la sesión
    const tituloSesion = contenedor.querySelector("#title-pp-title");
    const informacionSesion = contenedor.querySelector("#text-info-pp-title");

    // Historia de usuario actual
    const tituloHistoria = contenedor.querySelector("#title-pp-userHistory");
    const descripcionHistoria = contenedor.querySelector(
        "#text-info-pp-uH-description"
    );

    // Información de la votación
    const tituloVotacion = contenedor.querySelector("#title-pp-pV-title");
    const informacionVotacion = contenedor.querySelector("#text-info-pp-pV-info");

    // Cartas y estado de los participantes
    const contenedorCartasVotacion = contenedor.querySelector(
        "#pV-cards-section-cards"
    );

    // Resultados de la votación
    const promedioVotacion = contenedor.querySelector("#title-pp-rV-promedy");
    const informacionPromedio = contenedor.querySelector("#text-info-pp-rV-info");

    const contenedorResultados = contenedor.querySelector(
        "#rV-cards-section-cards"
    );

    // Estadísticas y análisis
    const tablaEstadisticas = contenedor.querySelector(
        "#statistics-cont-table table"
    );

    const recomendacion = contenedor.querySelector(
        "#text-info-pp-rS-recomendation"
    );

    // Selección de carta del desarrollador
    const tituloEleccion = contenedor.querySelector("#title-pp-choice-title");

    const botonesCartas = contenedor.querySelectorAll(
        "#card-pp-choice-cont-buttons .card-choice"
    );

    // Chat
    // Identidad del usuario que ha iniciado sesión.
    const nombreDesarrollador =
        sessionStorage.getItem("nombreUsuario") || "Desarrollador";

    const inputMensaje = contenedor.querySelector("#message-to-sent");
    const contenedorMensajes = contenedor.querySelector(
        "#message-cont-section-messages"
    );

    const btnEnviarMensaje = contenedor.querySelector("#btn-pp-sentMessage");

    // Estado local provisional
    let cartaSeleccionada = null;

    // Inicialización de eventos de las cartas
    botonesCartas.forEach((boton) => {
        boton.addEventListener("click", () => {
            seleccionarCarta(boton);
        });
    });

    // Inicialización del chat
    btnEnviarMensaje?.addEventListener("click", enviarMensaje);

    inputMensaje?.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" && !evento.shiftKey) {
            evento.preventDefault();
            enviarMensaje();
        }
    });

    /**
     * Prepara una acción para conectarla posteriormente con Socket.IO.
     * Por ahora, emite un evento personalizado en el contenedor.
     *
     * @param {string} accion - Nombre de la acción solicitada.
     * @param {Object} datos - Información asociada a la acción.
     */
    function emitirAccion(accion, datos = {}) {
        const evento = new CustomEvent("planning-poker:accion", {
            bubbles: true,
            detail: {
                accion,
                ...datos
            }
        });

        contenedor.dispatchEvent(evento);

        console.log("Acción de Planning Poker:", accion, datos);
    }

    /**
     * Crea un mensaje en el panel del chat.
     *
     * @param {string} emisor - Nombre de quien envía el mensaje.
     * @param {string} texto - Contenido del mensaje.
     * @param {boolean} propio - Indica si el mensaje es del desarrollador.
     */
    function mostrarMensaje(emisor, texto, propio = false) {
        if (!contenedorMensajes) return;

        const mensaje = document.createElement("div");
        mensaje.classList.add(
            "cont-message",
            propio ? "message-sent" : "message-received"
        );

        const encabezado = document.createElement("div");
        encabezado.classList.add("message-emisor");

        const nombre = document.createElement("p");
        nombre.classList.add("text-info-message-emisor-name");
        nombre.textContent = emisor;

        const contenido = document.createElement("div");
        contenido.classList.add("message-data");

        const textoMensaje = document.createElement("p");
        textoMensaje.classList.add("text-info-planning-poker-message-data");
        textoMensaje.textContent = texto;

        encabezado.appendChild(nombre);
        contenido.appendChild(textoMensaje);
        mensaje.append(encabezado, contenido);

        contenedorMensajes.appendChild(mensaje);

        // Mantiene visible el mensaje más reciente.
        contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
    }

    /**
     * Envía el mensaje del desarrollador.
     * La entrega a otros participantes se conectará con Socket.IO.
     */
    function enviarMensaje() {
        const texto = inputMensaje?.value.trim();

        if (!texto) return;

        emitirAccion("enviar-mensaje", {
            emisor: nombreDesarrollador,
            mensaje: texto
        });

        // Vista provisional mientras se conecta el servidor.
        mostrarMensaje(nombreDesarrollador, texto, true);

        inputMensaje.value = "";
        inputMensaje.focus();
    }

    // Seleccionar una carta para votar
    function seleccionarCarta(botonSeleccionado) {
        const valor = botonSeleccionado.dataset.valor;

        if (valor === undefined) {
            console.error("La carta seleccionada no tiene un valor definido.");
            return;
        }

        // Quitar la selección anterior
        botonesCartas.forEach((boton) => {
            boton.classList.remove("selected");
            boton.setAttribute("aria-pressed", "false");
        });

        // Marcar la nueva carta seleccionada
        botonSeleccionado.classList.add("selected");
        botonSeleccionado.setAttribute("aria-pressed", "true");

        cartaSeleccionada = valor;

        console.log("Carta seleccionada:", cartaSeleccionada);

        // Aquí se enviará el voto al servidor mediante Socket.IO.
    }


    // Mostrar el estado de la votación
    function actualizarEstadoVotacion(mensaje) {
        if (informacionVotacion) {
            informacionVotacion.textContent = mensaje;
        }
    }

    // Actualizar la información de la historia
    function actualizarHistoria(titulo, descripcion) {
        if (tituloHistoria) {
            tituloHistoria.textContent = titulo;
        }

        if (descripcionHistoria) {
            descripcionHistoria.textContent = descripcion;
        }
    }

    // Actualizar el resultado promedio
    function actualizarPromedio(promedio, participantes) {
        if (promedioVotacion) {
            promedioVotacion.textContent = promedio;
        }

        if (informacionPromedio) {
            informacionPromedio.textContent =
                `Promedio de ${participantes} participantes que votaron`;
        }
    }

    // Inicializar el estado visual de las cartas
    function limpiarSeleccion() {
        cartaSeleccionada = null;

        botonesCartas.forEach((boton) => {
            boton.classList.remove("selected");
            boton.setAttribute("aria-pressed", "false");
        });
    }

    // Funciones disponibles para futuras conexiones con el servidor.
    // Se exponen dentro de esta instancia para poder reutilizarlas
    // desde los eventos de Socket.IO u otros controles.

    contenedor.planningPokerDesarrollador = {
        seleccionarCarta,
        actualizarEstadoVotacion,
        actualizarHistoria,
        actualizarPromedio,
        limpiarSeleccion,
        mostrarMensaje
    };

    console.log("Controles de Planning Poker del desarrollador inicializados.");
}

export {
    inicializarPlanningPokerDesarrollador
}