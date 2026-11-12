// ==========================================
// 1. GESTIÓN DE SESIÓN (sessionStorage)
// ==========================================
const usuarioActual = JSON.parse(sessionStorage.getItem('usuarioActivo'));
const proyectoActual = JSON.parse(sessionStorage.getItem('proyectoActivo'));

const idRemitente = usuarioActual ? usuarioActual.id : null;
const idProyecto = proyectoActual ? proyectoActual.id : null;
let idDestinatarioSeleccionado = null; 
let chatActivo = "Dudas de requerimientos";

console.log("ID Remitente (Yo):", idRemitente);
console.log("ID Proyecto Actual:", idProyecto);

let mensajesDirectos = {};
let conversacionesCanales = {
    "Dudas de requerimientos": [],
    "Aprobaciones y entregas": [],
    "General del proyecto": []
};

/**
 * Función que se ejecuta al dar clic en un canal o en un contacto del proyecto
 */
function cambiarCanal(nombreChat, idDestinatario = null, esCanal = true) {

    // Limpiar el grupo seleccionado al cambiar de conversación
    window.grupoSeleccionadoMensajes = null;

    // Quitar el resaltado visual de los grupos
    document.querySelectorAll(
        '#modal-mensajes .grupos-tarjeta.activo'
    ).forEach(tarjeta => {
        tarjeta.classList.remove('activo');
    });

    chatActivo = nombreChat;
    
    if (!esCanal && idDestinatario) {
        idDestinatarioSeleccionado = idDestinatario;
        console.log(` ¡CONTACTO SELECCIONADO! ID Destinatario: ${idDestinatarioSeleccionado} (${nombreChat})`);
    } else {
        idDestinatarioSeleccionado = null;
        console.log(` Canal seleccionado: ${nombreChat}`);
    }

    // Actualizar título en la cabecera
    const tituloHeader = document.querySelector("#chatTituloHeader") || document.querySelector(".chat-header h3");
    if (tituloHeader) {
        tituloHeader.textContent = esCanal && !nombreChat.startsWith("#") ? `#${nombreChat}` : nombreChat;
    }

    // Cambiar clase activa visualmente
    document.querySelectorAll(".elemento-item, .opcion-contacto").forEach(item => {
        item.classList.remove("activo");
        if (item.textContent.includes(nombreChat)) {
            item.classList.add("activo");
        }
    });

    renderizarMensajes();
}

function renderizarMensajes() {
    const contenedor = document.querySelector("#contenedorMensajesChat") || document.querySelector(".chat-mensajes");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    const listaMensajes = idDestinatarioSeleccionado 
        ? (mensajesDirectos[idDestinatarioSeleccionado] || []) 
        : (conversacionesCanales[chatActivo] || []);

    if (listaMensajes.length === 0) {
        contenedor.innerHTML = `<div class="sin-mensajes" style="text-align: center; color: #888; margin-top: 20px;">No hay mensajes aún. ¡Inicia la conversación!</div>`;
        return;
    }

    listaMensajes.forEach(msg => {
        const divBurbuja = document.createElement("div");
        divBurbuja.className = `mensaje-burbuja ${msg.tipo}`;
        divBurbuja.innerHTML = `
            <span class="remitente">${msg.remitente}</span>
            <p>${msg.texto}</p>
        `;
        contenedor.appendChild(divBurbuja);
    });

    contenedor.scrollTop = contenedor.scrollHeight;
}

// ==========================================
// 2. CARGAR CONTACTOS REALES DE LA BD (Filtrados por Proyecto)
// ==========================================
async function cargarContactosEquipo() {
    if (!idProyecto || !idRemitente) {
        console.warn("⚠️ Faltan datos en el sessionStorage para buscar contactos.");
        return;
    }

    try {
        console.log(`Buscando contactos para el proyecto ID: ${idProyecto}, excluyendo usuario ID: ${idRemitente}`);
        const respuesta = await fetch(`/proyectos/contactos-proyecto/${idProyecto}/${idRemitente}`);
        const data = await respuesta.json();

        // --- AGREGA ESTOS DOS CONSOLE.LOG AQUÍ ---
        console.log("Respuesta cruda del servidor:", data);
        if (data.contactos) {
            console.log("Cantidad de compañeros encontrados en la BD:", data.contactos.length);
        }
        // ------------------------------------------

        if (data.ok && data.contactos) {
            const contenedorContactos = document.getElementById('listaContactosDirectos');            
            if (!contenedorContactos) {
                console.error("❌ OJO: No se encontró el contenedor HTML donde deben pintarse los contactos.");
                return;
            }
            
            let htmlHTML = '';
            data.contactos.forEach(contacto => {
                htmlHTML += `
                    <div class="opcion-contacto elemento-item" onclick="cambiarCanal('${contacto.nombre}', ${contacto.id}, false)">
                        <span class="punto-estado" style="color: #2ecc71;">🟢</span> ${contacto.nombre} <small>(${contacto.rol || 'Miembro'})</small>
                    </div>
                `;
            });

            contenedorContactos.innerHTML = htmlHTML;
            console.log("✅ Contactos del equipo pintados en pantalla con éxito.");
        }
    } catch (err) {
        console.error("❌ Error cargando la lista de contactos:", err);
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    renderizarMensajes();
    cargarContactosEquipo();
});