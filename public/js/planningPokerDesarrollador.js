/**
 * Efecto visual para alternar la selección de las cartas de votación.
 */
document.querySelectorAll('.card-choice').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.card-choice').forEach(btn => btn.classList.remove('selected'));
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

    if (contenedor.dataset.desarrolladorInicializado === "true") {
        return;
    }
    contenedor.dataset.desarrolladorInicializado = "true";

    // Elementos del DOM
    const tituloHistoria = contenedor.querySelector("#title-pp-userHistory");
    const descripcionHistoria = contenedor.querySelector("#text-info-pp-uH-description");
    const informacionVotacion = contenedor.querySelector("#text-info-pp-pV-info");
    const promedioVotacion = contenedor.querySelector("#title-pp-rV-promedy");
    const informacionPromedio = contenedor.querySelector("#text-info-pp-rV-info");
    
    const botonesCartas = contenedor.querySelectorAll("#card-pp-choice-cont-buttons .card-choice");
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 2, name: "Desarrollador Pruebas" };
    const nombreDesarrollador = usuarioActual.nombre;

    const inputMensaje = contenedor.querySelector("#message-to-sent");
    const contenedorMensajes = contenedor.querySelector("#message-cont-section-messages");
    const btnEnviarMensaje = contenedor.querySelector("#btn-pp-sentMessage");

    let cartaSeleccionada = null;

    // Eventos de selección de cartas
    botonesCartas.forEach((boton) => {
        boton.addEventListener("click", () => {
            seleccionarCarta(boton);
        });
    });

    // Eventos del chat
    btnEnviarMensaje?.addEventListener("click", enviarMensaje);
    inputMensaje?.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" && !evento.shiftKey) {
            evento.preventDefault();
            enviarMensaje();
        }
    });

    function emitirAccion(accion, datos = {}) {
        const evento = new CustomEvent("planning-poker:accion", {
            bubbles: true,
            detail: { accion, ...datos }
        });
        contenedor.dispatchEvent(evento);
    }

    function seleccionarCarta(botonSeleccionado) {
        const valor = botonSeleccionado.dataset.valor;
        if (valor === undefined) return;

        botonesCartas.forEach((boton) => {
            boton.classList.remove("selected");
            boton.setAttribute("aria-pressed", "false");
        });

        botonSeleccionado.classList.add("selected");
        botonSeleccionado.setAttribute("aria-pressed", "true");
        cartaSeleccionada = valor;

        console.log("Carta seleccionada por desarrollador:", cartaSeleccionada);

        // Disparar acción para enviar el voto al servidor mediante el script puente
        emitirAccion("enviar-voto", { valor: cartaSeleccionada });
    }

    function actualizarEstadoVotacion(mensaje) {
        if (informacionVotacion) {
            informacionVotacion.textContent = mensaje;
        }
    }

    function actualizarHistoria(titulo, descripcion) {
        if (tituloHistoria) tituloHistoria.textContent = titulo;
        if (descripcionHistoria) descripcionHistoria.textContent = descripcion;
    }

    function actualizarPromedio(promedio, participantes) {
        if (promedioVotacion) promedioVotacion.textContent = promedio ?? "—";
        if (informacionPromedio) {
            informacionPromedio.textContent = `Promedio de ${participantes} participantes que votaron con numero`;
        }
    }

    function limpiarSeleccion() {
        cartaSeleccionada = null;
        botonesCartas.forEach((boton) => {
            boton.classList.remove("selected");
            boton.setAttribute("aria-pressed", "false");
        });
    }

    function mostrarMensaje(emisor, texto, propio = false) {
        if (!contenedorMensajes) return;
        const mensaje = document.createElement("div");
        mensaje.classList.add("cont-message", propio ? "message-sent" : "message-received");

        mensaje.innerHTML = `
            <div class="message-emisor"><p class="text-info-message-emisor-name">${emisor}</p></div>
            <div class="message-data"><p class="text-info-planning-poker-message-data">${texto}</p></div>
        `;
        contenedorMensajes.appendChild(mensaje);
        contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
    }

    function enviarMensaje() {
        const texto = inputMensaje?.value.trim();
        if (!texto) return;

        emitirAccion("enviar-mensaje", { emisor: nombreDesarrollador, mensaje: texto });
        mostrarMensaje(nombreDesarrollador, texto, true);
        inputMensaje.value = "";
        inputMensaje.focus();
    }

    const cardProcessVoting = contenedor.querySelector("#card-pp-processVoting");
    const cardResultsVoting = contenedor.querySelector("#card-pp-resultsVoting");
    const cardResultStatistics = contenedor.querySelector("#card-pp-resultStatistics");

    function reiniciarVistaVotacion() {
        if (cardProcessVoting) cardProcessVoting.style.display = "block";
        if (cardResultsVoting) cardResultsVoting.style.display = "none";
        if (cardResultStatistics) cardResultStatistics.style.display = "none";
        
        const tabla = contenedor.querySelector("#statistics-cont-table table");
        if (tabla) {
            const rowData = tabla.querySelectorAll("tr:last-child td");
            rowData.forEach(td => td.textContent = "0");
        }
        const recomendacion = contenedor.querySelector("#text-info-pp-rS-recomendation");
        if (recomendacion) {
            recomendacion.textContent = "Espera a que el facilitador abra la discusión o cierre la votacion.";
        }
        limpiarSeleccion();
    }

    function renderizarTarjetasVotando(participants = [], votes = {}) {
        if (cardProcessVoting) cardProcessVoting.style.display = "block";
        if (cardResultsVoting) cardResultsVoting.style.display = "none";
        if (cardResultStatistics) cardResultStatistics.style.display = "none";

        const seccionTarjetas = contenedor.querySelector("#pV-cards-section-cards");
        if (!seccionTarjetas) return;
        seccionTarjetas.innerHTML = "";

        participants.forEach(p => {
            const yaVoto = votes[p.id] && votes[p.id].hasVoted;
            const cardDiv = document.createElement("div");
            cardDiv.className = "card-voting-hidden";
            cardDiv.innerHTML = `
                <div class="card-voting-hidden-visual ${yaVoto ? 'voted' : 'unvoted'}"></div>
                <div class="card-voting-hidden-info">
                    <p class="text-info-planning-poker">${p.name}</p>
                    <p class="text-info-planning-poker" style="font-size: 11px; color: gray;">
                        ${yaVoto ? 'Voto registrado' : 'Aún no vota'}
                    </p>
                </div>
            `;
            seccionTarjetas.appendChild(cardDiv);
        });
    }

    function renderizarResultados(data) {
        if (cardProcessVoting) cardProcessVoting.style.display = "none";
        if (cardResultsVoting) cardResultsVoting.style.display = "block";
        if (cardResultStatistics) cardResultStatistics.style.display = "block";

        actualizarPromedio(data.average, data.numericVotesCount);

        const seccionResultadosCards = contenedor.querySelector("#rV-cards-section-cards");
        if (seccionResultadosCards) {
            seccionResultadosCards.innerHTML = "";
            data.participants.forEach(p => {
                const votoObj = data.votes[p.id];
                let valorVoto = votoObj ? votoObj.vote : "-";
                if (valorVoto === "UNKNOWN") valorVoto = "?";
                if (valorVoto === "BREAK") valorVoto = "☕";
                const fueVotado = votoObj && votoObj.hasVoted;

                const cardDiv = document.createElement("div");
                cardDiv.className = "card-voting-revealed";
                cardDiv.innerHTML = `
                    <div class="card-voting-revealed-visual ${fueVotado ? 'voted' : 'unvoted'}">
                        <p class="text-info-result-vote">${valorVoto}</p>
                    </div>
                    <div class="card-voting-revealed-info">
                        <p class="text-info-planning-poker">${p.name}</p>
                    </div>
                `;
                seccionResultadosCards.appendChild(cardDiv);
            });
        }

        // Llenar tabla estadística en vista de desarrollador
        const tabla = contenedor.querySelector("#statistics-cont-table table");
        if (tabla && data.voteCounts) {
            const headers = tabla.querySelectorAll("tr:first-child th");
            const rowData = tabla.querySelectorAll("tr:last-child td");
            
            headers.forEach((th, index) => {
                const key = th.textContent.trim();
                if (rowData[index]) {
                    rowData[index].textContent = data.voteCounts[key] || 0;
                }
            });
        }

        const recomendacion = contenedor.querySelector("#text-info-pp-rS-recomendation");
        if (recomendacion && data.recommendation) {
            recomendacion.textContent = data.recommendation;
        }
    }

    contenedor.planningPokerDesarrollador = {
        seleccionarCarta,
        actualizarEstadoVotacion,
        actualizarHistoria,
        actualizarPromedio,
        limpiarSeleccion,
        mostrarMensaje,
        renderizarTarjetasVotando,
        renderizarResultados,
        reiniciarVistaVotacion
    };

    console.log("Controles de Planning Poker del desarrollador inicializados.");
}

// Exponer globalmente
window.inicializarPlanningPokerDesarrollador = inicializarPlanningPokerDesarrollador;

