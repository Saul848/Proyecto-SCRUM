/**
 * Módulo de cliente para la gestión del chat del desarrollador (PB-11)
 * @module mensajesDesarrollador
 */

const contenedorMensajes = document.getElementById("contenedorMensajes");
const inputMensaje = document.getElementById("inputMensaje");
const btnEnviarMensaje = document.getElementById("btnEnviarMensaje");
const tituloCanalActual = document.getElementById("tituloCanalActual");

// ID de grupo activo por defecto (ej. Grupo 1: Dudas de requerimientos)
let idGrupoActual = 1;
// ID del usuario logueado actual (puedes adaptarlo según tu sesión)
const idUsuarioActual = 1; 

/**
 * Obtiene y renderiza los mensajes del grupo seleccionado desde el servidor.
 * @async
 * @param {number} idGrupo - Identificador único del grupo.
 * @param {string} nombreGrupo - Nombre del canal o grupo seleccionado.
 */
async function cargarMensajesGrupo(idGrupo, nombreGrupo) {
    idGrupoActual = idGrupo;
    tituloCanalActual.textContent = nombreGrupo;

    try {
        const respuesta = await fetch(`/mensajes/grupo/${idGrupo}`);
        const resultado = await respuesta.json();

        if (resultado.ok) {
            renderizarMensajes(resultado.data);
        }
    } catch (err) {
        console.error("Error al cargar los mensajes del grupo:", err);
    }
}

/**
 * Pinta las burbujas de mensajes en el contenedor de chat.
 * @param {Array<Object>} mensajes - Lista de objetos de mensajes obtenidos de la base de datos.
 */
function renderizarMensajes(mensajes) {
    contenedorMensajes.innerHTML = "";

    if (mensajes.length === 0) {
        contenedorMensajes.innerHTML = `<p style="text-align: center; color: #94a3b8; 
        font-size: 13px;">No hay mensajes en este canal todavía. ¡Sé el primero en escribir!</p>`;
        return;
    }

    mensajes.forEach((msg) => {
        const esMio = msg.id_autor === idUsuarioActual;
        const burbujaHtml = document.createElement("div");
        burbujaHtml.className = `burbuja ${esMio ? "enviada" : "recibida"}`;

        burbujaHtml.innerHTML = `
            <span class="remitente">${esMio ? "Tú (desarrollador)" : 
            (msg.autor_nombre || "Integrante")}</span>
            ${msg.mensaje}
        `;
        contenedorMensajes.appendChild(burbujaHtml);
    });

    // Auto-scroll hacia el mensaje más reciente
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

/**
 * Envía un nuevo mensaje al servidor mediante una petición POST.
 * @async
 */
async function enviarMensaje() {
    const textoMensaje = inputMensaje.value.trim();

    if (textoMensaje === "") return;

    try {
        const respuesta = await fetch("/mensajes/grupo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idAutor: idUsuarioActual,
                idGrupoDestino: idGrupoActual,
                mensaje: textoMensaje
            })
        });

        const resultado = await respuesta.json();

        if (resultado.ok) {
            inputMensaje.value = "";
            // Recargamos los mensajes para ver el nuevo chat reflejado
            await cargarMensajesGrupo(idGrupoActual, tituloCanalActual.textContent);
        } else {
            alert(resultado.error || "No se pudo enviar el mensaje");
        }
    } catch (err) {
        console.error("Error al enviar el mensaje:", err);
    }
}

/**
 * Cambia de canal activo al hacer clic sobre la lista lateral.
 * @param {number} idGrupo 
 * @param {string} nombre 
 */
function seleccionarCanal(idGrupo, nombre) {
    // Remover clase activo de todos y agregársela al seleccionado
    document.querySelectorAll(".elemento-item").forEach(el => el.classList.remove("activo"));
    event.currentTarget.classList.add("activo");
    
    cargarMensajesGrupo(idGrupo, nombre);
}

// Event Listeners
btnEnviarMensaje.addEventListener("click", enviarMensaje);
inputMensaje.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        enviarMensaje();
    }
});

// Carga inicial al montar el componente
document.addEventListener("DOMContentLoaded", () => {
    cargarMensajesGrupo(idGrupoActual, "Desarrolladores, Scrum Master");
});