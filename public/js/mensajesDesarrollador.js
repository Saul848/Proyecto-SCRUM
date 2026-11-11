/**
 * Inicializa la lógica del chat y la mensajería en la vista del desarrollador.
 * Valida la sesión activa, maneja la carga de mensajes en canales y chats directos,
 * y gestiona los eventos de envío y cambio de conversaciones.
 * 
 * @function inicializarChatDesarrollador
 * @returns {void} No retorna ningún valor.
 */
document.addEventListener('DOMContentLoaded', () => {
// 1. Validar identidad del usuario activo
const sesion = sessionStorage.getItem('usuarioActivo');
if (!sesion) {
    window.location.href = '/html/login.html';
    return;
}
const usuarioActivo = JSON.parse(sesion);

// 2. Elementos del DOM
const feed = document.getElementById('messages-feed');
const inputMensaje = document.getElementById('mensaje-input');
const btnEnviar = document.getElementById('btn-enviar');
const itemsCanales = document.querySelectorAll('.channel-item');
const tituloCanal = document.getElementById('canal-titulo');

const contactoFacilitador = document.getElementById('contacto-facilitador') || document.querySelector('.direct-contact-item');

let canalActualId = 1;
let tipoChatActual = 'canal'; 
let idDestinoActual = 2; 

/**
 * Carga de forma asíncrona los mensajes del canal actual o del chat privado directo.
 * Actualiza el DOM limpiando y renderizando el feed de mensajes.
 * 
 * @async
 * @function cargarMensajes
 * @returns {Promise<void>}
 */
async function cargarMensajes() {
    try {
    let url = '';
    if (tipoChatActual === 'canal') {
        url = `/mensajes/${canalActualId}`;
    } else {
        url = `/mensajes/directos/${usuarioActivo.id}/${idDestinoActual}`;
    }

    const res = await fetch(url);
    const resultado = await res.json();

    if (!res.ok || !resultado.ok) {
        console.error('Error al cargar mensajes:', resultado.error);
        return;
    }

    feed.innerHTML = '';

    if (resultado.data.length === 0) {
        feed.innerHTML = `<p style="text-align:center; color:#888; font-size:0.85rem; margin-top:20px;">No hay mensajes ${tipoChatActual === 'canal' ? 'en este canal' : 'en este chat privado'}. ¡Comienza la charla técnica!</p>`;
        return;
    }

    resultado.data.forEach(msg => {
        const autorId = msg.id_usuario || msg.id_autor;
        const esMio = autorId === usuarioActivo.id;
        agregarBurbujaAlFeed(msg.nombre_usuario || msg.username, msg.contenido, esMio);
    });

    desplazarAlFondo();
    } catch (err) {
    console.error('Error de conexión al cargar mensajes:', err);
    }
}

/**
 * Crea y añade una burbuja de mensaje visual en el feed de la interfaz de chat.
 * 
 * @function agregarBurbujaAlFeed
 * @param {string} remitente - Nombre de la persona que envió el mensaje.
 * @param {string} texto - Contenido textual del mensaje.
 * @param {boolean} esMio - Indica si el mensaje fue enviado por el usuario activo.
 * @returns {void}
 */
function agregarBurbujaAlFeed(remitente, texto, esMio) {
    const bloque = document.createElement('div');
    bloque.classList.add('message-block', esMio ? 'outgoing' : 'incoming');

    const nombre = document.createElement('span');
    nombre.classList.add('sender-name');
    nombre.textContent = esMio ? 'Tú (Desarrollador)' : remitente;

    const burbuja = document.createElement('div');
    burbuja.classList.add('bubble', esMio ? 'bubble-outgoing' : 'bubble-incoming');
    burbuja.textContent = texto;

    bloque.appendChild(nombre);
    bloque.appendChild(burbuja);
    feed.appendChild(bloque);
}

/**
 * Desplaza automáticamente el contenedor de mensajes hacia el fondo para mostrar el chat más reciente.
 * 
 * @function desplazarAlFondo
 * @returns {void}
 */
function desplazarAlFondo() {
    feed.scrollTop = feed.scrollHeight;
}

/**
 * Envía un mensaje nuevo (ya sea a un canal o mensaje directo) mediante una petición POST al servidor.
 * 
 * @async
 * @function enviarMensaje
 * @returns {Promise<void>}
 */
async function enviarMensaje() {
    const contenido = inputMensaje.value.trim();
    if (!contenido) return;

    try {
    let url = '';
    let bodyData = {};

    if (tipoChatActual === 'canal') {
        url = '/mensajes';
        bodyData = {
        idCanal: canalActualId,
        idUsuario: usuarioActivo.id,
        contenido: contenido
        };
    } else {
        url = '/mensajes/directos';
        bodyData = {
        idAutor: usuarioActivo.id,
        idUsuarioDestino: idDestinoActual,
        contenido: contenido
        };
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    const resultado = await res.json();

    if (!res.ok || !resultado.ok) {
        alert(resultado.error || 'Error al enviar el mensaje');
        return;
    }

    agregarBurbujaAlFeed(usuarioActivo.nombre, contenido, true);
    inputMensaje.value = '';
    desplazarAlFondo();
    } catch (err) {
    console.error('Error al enviar mensaje:', err);
    alert('No se pudo enviar el mensaje.');
    }
}

btnEnviar.addEventListener('click', enviarMensaje);
inputMensaje.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
    e.preventDefault();
    enviarMensaje();
    }
});

itemsCanales.forEach((item, index) => {
    item.addEventListener('click', () => {
    tipoChatActual = 'canal';
    itemsCanales.forEach(c => c.classList.remove('active'));
    if (contactoFacilitador) contactoFacilitador.classList.remove('active');
    
    item.classList.add('active');
    canalActualId = index + 1;
    tituloCanal.textContent = item.querySelector('.channel-name')?.textContent || 'Canal de Desarrollo';

    cargarMensajes();
    });
});

if (contactoFacilitador) {
    contactoFacilitador.addEventListener('click', () => {
    tipoChatActual = 'directo';
    itemsCanales.forEach(c => c.classList.remove('active'));
    contactoFacilitador.classList.add('active');
    tituloCanal.textContent = 'Chat privado con Facilitador';
    cargarMensajes();
    });
}

cargarMensajes();
});