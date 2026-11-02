// Objeto con el historial de conversaciones (canales y contactos directos)
const conversaciones = {
    "Dudas de requerimientos": [
        { remitente: "Desarrollador 1", texto: "Hola Juan Carlos, para comentarte que no pude terminar una historia de usuario.", tipo: "recibido" }
    ],
    "Aprobaciones y entregas": [
        { remitente: "Facilitador", texto: "Canal listo para coordinar entregas de sprint.", tipo: "enviado" }
    ],
    "General del proyecto": [
        { remitente: "Desarrollador 2", texto: "¿A qué hora nos reunimos para el diario?", tipo: "recibido" }
    ],
    "Saúl Ortiz (cliente)": [
        { remitente: "Saúl Ortiz", texto: "Hola Alejandra, ¿cómo va el avance con el backlog?", tipo: "recibido" }
    ],
    "Desarrollador 1": [
        { remitente: "Desarrollador 1", texto: "Ya subí los cambios a la rama principal.", tipo: "recibido" }
    ],
    "Desarrollador 2": [
        { remitente: "Desarrollador 2", texto: "Revisando los detalles de la base de datos.", tipo: "recibido" }
    ]
};

let chatActivo = "Dudas de requerimientos";

/**
 * Función principal para cambiar de canal o chat directo
 */
function cambiarCanal(nombreChat) {
    chatActivo = nombreChat;

    // 1. Actualizar el título principal del chat en pantalla
    const tituloHeader = document.querySelector("#chatTituloHeader") || document.querySelector(".chat-header h3");
    if (tituloHeader) {
        // Si no tiene el # y no es contacto, le agregamos el # para estética de canal
        const esCanal = !nombreChat.includes("Saúl") && !nombreChat.includes("Desarrollador");
        tituloHeader.textContent = esCanal && !nombreChat.startsWith("#") ? `#${nombreChat}` : nombreChat;
    }

    // 2. Manejar la clase 'activo' visualmente en la lista
    document.querySelectorAll(".elemento-item").forEach(item => {
        item.classList.remove("activo");
        // Limpiamos emojis del texto para comparar correctamente
        const textoLimpio = item.textContent.replace(/[🟢🔴#]/g, "").trim();
        if (textoLimpio === nombreChat.replace("#", "").trim()) {
            item.classList.add("activo");
        }
    });

    // 3. Renderizar los mensajes correspondientes
    renderizarMensajes();
}

/**
 * Dibuja las burbujas de mensajes en la caja de conversación
 */
function renderizarMensajes() {
    const contenedor = document.querySelector("#contenedorMensajesChat") || document.querySelector(".chat-mensajes");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    const listaMensajes = conversaciones[chatActivo] || [];

    listaMensajes.forEach(msg => {
        const divBurbuja = document.createElement("div");
        divBurbuja.className = `mensaje-burbuja ${msg.tipo}`;
        divBurbuja.innerHTML = `
            <span class="remitente">${msg.remitente}</span>
            <p>${msg.texto}</p>
        `;
        contenedor.appendChild(divBurbuja);
    });

    // Scroll automático al final
    contenedor.scrollTop = contenedor.scrollHeight;
}

/**
 * Envía un mensaje en el chat activo
 */
function enviarMensaje() {
    const input = document.querySelector("#inputMensaje") || document.querySelector("input[type='text']");
    if (!input || input.value.trim() === "") return;

    const texto = input.value.trim();

    if (!conversaciones[chatActivo]) {
        conversaciones[chatActivo] = [];
    }

    conversaciones[chatActivo].push({
        remitente: "Tú (Facilitador)",
        texto: texto,
        tipo: "enviado"
    });

    input.value = "";
    renderizarMensajes();
}

async function enviarMensaje() {
    console.log("1. ¡Se intentó enviar un mensaje!");

    // Buscamos directo por el ID exacto que tiene tu input en el HTML ("inputMensaje")
    const input = document.getElementById("inputMensaje");
    
    if (!input) {
        console.error("❌ Error: No se encontró el elemento con id 'inputMensaje'");
        return;
    }

    const texto = input.value.trim();
    console.log("2. Texto capturado:", texto);

    if (texto === "") {
        console.warn("⚠️ El mensaje está vacío, no se envía nada.");
        return;
    }

    const idAutor = 1; 
    const idGrupoDestino = 1; 

    try {
        console.log("3. Enviando fetch al servidor...");
        const respuesta = await fetch('/mensajes/grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_autor: idAutor,
                id_grupo_destino: idGrupoDestino,
                mensaje: texto
            })
        });

        const resultado = await respuesta.json();
        console.log("4. Respuesta recibida del servidor:", resultado);

        if (resultado.ok) {
            input.value = ""; // Limpiamos la cajita de texto
            console.log("✅ ¡Mensaje guardado en la BD con éxito!");
        } else {
            console.error("❌ El servidor rechazó el mensaje:", resultado.mensaje);
        }
    } catch (error) {
        console.error("❌ Error crítico de red en el fetch:", error);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const btnEnviar = document.getElementById("btnEnviar");
    const inputMensaje = document.getElementById("inputMensaje");

    // Si el botón existe en la pantalla, le damos la orden de enviar al hacer clic
    if (btnEnviar) {
        btnEnviar.addEventListener("click", () => {
            enviarMensaje();
        });
    }

    // Si el input existe, le damos la orden de enviar al presionar la tecla Enter
    if (inputMensaje) {
        inputMensaje.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                enviarMensaje();
            }
        });
    }
});