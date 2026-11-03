//////////////////////////////////////////////////////////////
// Carga dinámica del modal de planning poker para desarrollador y conexión con Socket.IO
//////////////////////////////////////////////////////////////

let planningPokerCargando = false;
let planningPokerJS = null;

async function abrirPlanningPokerParaDesarrollador() {
    const sprintId = 1;
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActivo")) || { id: 2, name: "Desarrollador Pruebas" };
    const role = "desarrollador";

    const zonaDeTrabajo = document.getElementById("zonaDeTrabajo");
    if (!zonaDeTrabajo) return;

    if (planningPokerCargando) return;
    planningPokerCargando = true;

    try {
        // 1. Cargar HTML del modal si no existe en el DOM
        if (!document.getElementById("modal-planning-poker-desarrollador")) {
            const respuesta = await fetch("./planningPokerDesarrollador.html");
            const html = await respuesta.text();
            zonaDeTrabajo.insertAdjacentHTML("beforeend", html);
        }

        // 2. Cargar el JS interno de la interfaz del desarrollador si no existe
        if (!planningPokerJS) {
            planningPokerJS = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "../js/planningPokerDesarrollador.js";
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }

        await planningPokerJS;

        // 3. Inicializar componentes visuales
        const contenedor = document.getElementById("cont-planning-poker");
        if (window.inicializarPlanningPokerDesarrollador) {
            window.inicializarPlanningPokerDesarrollador(contenedor);
        }
        mostrarModal("modal-planning-poker-desarrollador");

        // 4. INICIALIZAR SOCKET.IO
        const socket = io(); 

        socket.emit("join-planning-session", {
            sprintId: sprintId,
            user: usuarioActual,
            role: role
        });

        // 5. Escuchar advertencia si el facilitador aún no inicia la sesión
        socket.on("session-not-found", (mensaje) => {
            alert(mensaje || "Aún no hay una sesión de Planning Poker activa. Espera a que el facilitador la inicie.");
            const modal = document.getElementById("modal-planning-poker-desarrollador");
            if (modal) modal.style.display = "none";
            socket.disconnect();
        });

        // 6. Escuchar eventos de la sesión activa
        socket.on("sync-session-state", (data) => {
            actualizarUIHistoria(contenedor, data);
            contenedor.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
        });
        
        socket.on("load-next-story", (data) => {
            actualizarUIHistoria(contenedor, data);
            contenedor.planningPokerDesarrollador?.reiniciarVistaVotacion();
            if (data.participants && data.votes) {
                contenedor.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
            }
        });

        // Escuchar reseteo al repetir votación
        socket.on("vote-reset", (data) => {
            contenedor.planningPokerDesarrollador?.reiniciarVistaVotacion();
            if (data.participants && data.votes) {
                contenedor.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
            }
        });

        socket.on("vote-progress", (data) => {
            contenedor.planningPokerDesarrollador?.actualizarEstadoVotacion(
                `${data.totalVoted} de ${data.totalParticipants} desarrolladores ya votaron`
            );
            contenedor.planningPokerDesarrollador?.renderizarTarjetasVotando(data.participants, data.votes);
        });

        socket.on("cards-revealed", (data) => {
            contenedor.planningPokerDesarrollador?.renderizarResultados(data);
        });

        socket.on("session-finished", () => {
            alert("El facilitador ha finalizado la sesión de Planning Poker.");
            const modal = document.getElementById("modal-planning-poker-desarrollador");
            if (modal) modal.style.display = "none";
            socket.disconnect();

            // REDIRECCIÓN A PANTALLA DE REUNIONES O VISTA PRINCIPAL O MODAL
            window.location.href = "./reuniones.html"; // Cambia la ruta según proyecto
        });

        // 7. Enviar acciones del desarrollador al servidor
        contenedor.addEventListener("planning-poker:accion", (evento) => {
            const { accion, ...datos } = evento.detail;

            if (accion === "enviar-voto") {
                socket.emit("submit-vote", {
                    sprintId,
                    userId: usuarioActual.id,
                    voteValue: datos.valor
                });
            }
        });

    } catch (error) {
        console.error("Error al iniciar Planning Poker para desarrollador:", error);
        planningPokerJS = null;
    } finally {
        planningPokerCargando = false;
    }
}

function actualizarUIHistoria(contenedor, data) {
    if (contenedor && contenedor.planningPokerDesarrollador) {
        contenedor.planningPokerDesarrollador.actualizarHistoria(
            data.currentStory.titulo,
            data.currentStory.descripcion
        );
        
        const infoSesion = contenedor.querySelector("#text-info-pp-title");
        if (infoSesion) {
            infoSesion.textContent = `Historia ${data.storyIndex + 1} de ${data.totalStories} · Sesión de estimación`;
        }
    }
}

window.abrirPlanningPokerParaDesarrollador = abrirPlanningPokerParaDesarrollador;