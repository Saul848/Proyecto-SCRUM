
/**
 * Inicializa los controles de Planning Poker del facilitador.
 * El facilitador administra la sesión, pero no participa en la votación.
 *
 * @param {HTMLElement} contenedor - Elemento que contiene el main de Planning Poker.
 */
function inicializarPlanningPokerFacilitador(contenedor) {
    if (!contenedor) {
        console.error("No se encontró el contenedor de Planning Poker.");
        return;
    }

    // Evita registrar los mismos eventos más de una vez.
    if (contenedor.dataset.planningPokerInicializado === "true") {
        return;
    }

    contenedor.dataset.planningPokerInicializado = "true";

    // Información de la historia actual.
    const tituloHistoria = contenedor.querySelector("#title-pp-userHistory");
    const descripcionHistoria = contenedor.querySelector(
        "#text-info-pp-uH-description"
    );
    const informacionSesion = contenedor.querySelector("#text-info-pp-title");

    // Información del proceso de votación.
    const tituloVotacion = contenedor.querySelector("#title-pp-pV-title");
    const informacionVotacion = contenedor.querySelector(
        "#text-info-pp-pV-info"
    );

    // Resultados de la votación.
    const promedioVotacion = contenedor.querySelector("#title-pp-rV-promedy");
    const informacionPromedio = contenedor.querySelector(
        "#text-info-pp-rV-info"
    );

    // Recomendación para analizar las diferencias entre votos.
    const recomendacionVotacion = contenedor.querySelector(
        "#text-info-pp-rS-recomendation"
    );

    // Botones de control de la sesión.
    const btnMostrarCartas = contenedor.querySelector("#btn-pp-showCards");
    const btnRepetirVoto = contenedor.querySelector("#btn-pp-repeatVote");
    const btnSaltarVoto = contenedor.querySelector("#btn-pp-skipVote");
    const btnConfirmar = contenedor.querySelector("#btn-pp-confirm");

    // Control de la estimación final.
    const selectEstimacion = contenedor.querySelector(
        "#rA-select-estimateFinal"
    );

    // Elementos del chat.
    const btnEnviarMensaje = contenedor.querySelector("#btn-pp-sentMessage");
    const inputMensaje = contenedor.querySelector("#message-to-sent");
    const contenedorMensajes = contenedor.querySelector(
        "#message-cont-section-messages"
    );

    // Identidad del usuario que ha iniciado sesión.
    const nombreFacilitador =
        sessionStorage.getItem("nombreUsuario") || "Facilitador";

    // Inicialización de eventos de los botones.
    btnMostrarCartas?.addEventListener("click", revelarCartas);
    btnRepetirVoto?.addEventListener("click", repetirVotacion);
    btnSaltarVoto?.addEventListener("click", saltarHistoria);
    btnConfirmar?.addEventListener("click", confirmarEstimacion);
    btnEnviarMensaje?.addEventListener("click", enviarMensaje);

    // Enviar el mensaje al presionar Enter.
    // Shift + Enter permite escribir una nueva línea.
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
     * Solicita mostrar las cartas de los participantes.
     */
    function revelarCartas() {
        if (!window.confirm("¿Deseas revelar las cartas de los participantes?")) {
            return;
        }

        emitirAccion("revelar-cartas");
    }

    /**
     * Solicita iniciar otra ronda de votación para la historia actual.
     */
    function repetirVotacion() {
        if (!window.confirm("¿Deseas iniciar una nueva votación?")) {
            return;
        }

        emitirAccion("repetir-votacion");
    }

    /**
     * Solicita avanzar a la siguiente historia del Sprint.
     */
    function saltarHistoria() {
        if (!window.confirm("¿Deseas saltar esta historia?")) {
            return;
        }

        emitirAccion("saltar-historia");
    }

    /**
     * Valida la estimación elegida por el facilitador y solicita guardarla.
     */
    function confirmarEstimacion() {
        const estimacion = selectEstimacion?.value;

        if (!estimacion) {
            alert("Selecciona una estimación antes de continuar.");
            return;
        }

        if (!window.confirm(
            `¿Confirmas la estimación final de ${estimacion} puntos?`
        )) {
            return;
        }

        emitirAccion("confirmar-estimacion", {
            estimacion: Number(estimacion)
        });
    }

    /**
     * Crea un mensaje en el panel del chat.
     *
     * @param {string} emisor - Nombre de quien envía el mensaje.
     * @param {string} texto - Contenido del mensaje.
     * @param {boolean} propio - Indica si el mensaje es del facilitador.
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
     * Envía el mensaje del facilitador.
     * La entrega a otros participantes se conectará con Socket.IO.
     */
    function enviarMensaje() {
        const texto = inputMensaje?.value.trim();

        if (!texto) return;

        emitirAccion("enviar-mensaje", {
            emisor: nombreFacilitador,
            mensaje: texto
        });

        // Vista provisional mientras se conecta el servidor.
        mostrarMensaje(nombreFacilitador, texto, true);

        inputMensaje.value = "";
        inputMensaje.focus();
    }

    /**
     * Actualiza la información de la historia actual.
     * Puede invocarse cuando el servidor entregue otra historia.
     *
     * @param {Object} historia - Datos de la historia.
     * @param {string} historia.titulo - Título de la historia.
     * @param {string} historia.descripcion - Descripción de la historia.
     * @param {number} historia.numero - Número de la historia actual.
     * @param {number} historia.total - Total de historias de la sesión.
     * @param {string} historia.sprint - Identificador o nombre del Sprint.
     */
    function actualizarHistoria({
        titulo,
        descripcion,
        numero,
        total,
        sprint
    }) {
        if (tituloHistoria && titulo !== undefined) {
            tituloHistoria.textContent = titulo;
        }

        if (descripcionHistoria && descripcion !== undefined) {
            descripcionHistoria.textContent = descripcion;
        }

        if (informacionSesion) {
            informacionSesion.textContent =
                `Historia ${numero} de ${total} · Sesión de estimación del ${sprint}`;
        }
    }

    /**
     * Actualiza el estado general de la votación.
     *
     * @param {Object} estado - Información recibida del servidor.
     * @param {number} estado.votados - Participantes que ya votaron.
     * @param {number} estado.total - Participantes que deben votar.
     * @param {string} estado.titulo - Estado actual de la votación.
     */
    function actualizarEstadoVotacion({ votados, total, titulo }) {
        if (tituloVotacion && titulo !== undefined) {
            tituloVotacion.textContent = titulo;
        }

        if (informacionVotacion) {
            informacionVotacion.textContent =
                `${votados} de ${total} participantes ya votaron`;
        }
    }

    /**
     * Actualiza el promedio y la información de los resultados.
     *
     * @param {Object} resultado - Datos calculados por el servidor.
     * @param {number|string} resultado.promedio - Promedio de los votos.
     * @param {number} resultado.participantes - Participantes que votaron.
     */
    function actualizarResultados({ promedio, participantes }) {
        if (promedioVotacion) {
            promedioVotacion.textContent = promedio ?? "—";
        }

        if (informacionPromedio) {
            informacionPromedio.textContent =
                `Promedio de ${participantes} participantes que votaron`;
        }
    }

    /**
     * Actualiza la recomendación para discutir las diferencias entre votos.
     *
     * @param {string} texto - Recomendación recibida o calculada.
     */
    function actualizarRecomendacion(texto) {
        if (recomendacionVotacion) {
            recomendacionVotacion.textContent = texto;
        }
    }

    /**
     * Permite al código que integra este panel actualizar la interfaz.
     * Estas funciones no realizan peticiones al servidor por sí solas.
     */
    contenedor.planningPokerFacilitador = {
        actualizarHistoria,
        actualizarEstadoVotacion,
        actualizarResultados,
        actualizarRecomendacion,
        mostrarMensaje
    };

    // El facilitador administra la sesión, pero no vota.
    console.log("Controles de Planning Poker del facilitador inicializados.");
}

export {
    inicializarPlanningPokerFacilitador
}
