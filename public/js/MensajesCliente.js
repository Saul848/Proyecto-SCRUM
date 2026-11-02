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
  
  // Elemento del contacto directo en la barra lateral
  const contactoFacilitador = document.getElementById('contacto-facilitador') || document.querySelector('.direct-contact-item');

  // Estados de la vista actual
  let canalActualId = 1; // Por defecto canal 1
  let tipoChatActual = 'canal'; // 'canal' o 'directo'
  let idDestinoActual = 2; // ID del contacto directo en tu base de datos

  // 3. Función general para cargar mensajes (Canal o Directo)
  async function cargarMensajes() {
    try {
      let url = '';
      if (tipoChatActual === 'canal') {
        url = `/mensajes/${canalActualId}`;
      } else {
        // Ruta para chat directo utilizando el ID del contacto destino
        url = `/mensajes/directos/${usuarioActivo.id}/${idDestinoActual}`;
      }

      const res = await fetch(url);
      const resultado = await res.json();

      if (!res.ok || !resultado.ok) {
        console.error('Error al cargar mensajes:', resultado.error);
        return;
      }

      // Limpiar feed actual
      feed.innerHTML = '';

      if (resultado.data.length === 0) {
        feed.innerHTML = `<p style="text-align:center; color:#888; font-size:0.85rem; margin-top:20px;">No hay mensajes ${tipoChatActual === 'canal' ? 'en este canal' : 'en este chat privado'}. ¡Inicia la conversación!</p>`;
        return;
      }

      // Renderizar cada mensaje
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

  // 4. Función para renderizar una burbuja visual en el chat
  function agregarBurbujaAlFeed(remitente, texto, esMio) {
    const bloque = document.createElement('div');
    bloque.classList.add('message-block', esMio ? 'outgoing' : 'incoming');

    const nombre = document.createElement('span');
    nombre.classList.add('sender-name');
    nombre.textContent = esMio ? 'Tú (Cliente)' : remitente;

    const burbuja = document.createElement('div');
    burbuja.classList.add('bubble', esMio ? 'bubble-outgoing' : 'bubble-incoming');
    burbuja.textContent = texto;

    bloque.appendChild(nombre);
    bloque.appendChild(burbuja);
    feed.appendChild(bloque);
  }

  function desplazarAlFondo() {
    feed.scrollTop = feed.scrollHeight;
  }

  // 5. Función para enviar un nuevo mensaje (Canal o Directo)
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

      // Pintar mensaje enviado y limpiar caja de texto
      agregarBurbujaAlFeed(usuarioActivo.nombre, contenido, true);
      inputMensaje.value = '';
      desplazarAlFondo();
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('No se pudo enviar el mensaje.');
    }
  }

  // 6. Listeners para el botón enviar y tecla Enter
  btnEnviar.addEventListener('click', enviarMensaje);

  inputMensaje.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarMensaje();
    }
  });

  // 7. Cambio de canal en la barra lateral
  itemsCanales.forEach((item, index) => {
    item.addEventListener('click', () => {
      tipoChatActual = 'canal';
      
      itemsCanales.forEach(c => c.classList.remove('active'));
      if (contactoFacilitador) contactoFacilitador.classList.remove('active');
      
      item.classList.add('active');

      canalActualId = index + 1; // 1: Dudas, 2: Aprobaciones, 3: General
      const nombreCanal = item.querySelector('.channel-name')?.textContent || 'Canal';
      tituloCanal.textContent = nombreCanal;

      cargarMensajes();
    });
  });

  // Listener para cuando den clic en el Contacto Directo 
  if (contactoFacilitador) {
    contactoFacilitador.addEventListener('click', () => {
      tipoChatActual = 'directo';

      itemsCanales.forEach(c => c.classList.remove('active'));
      contactoFacilitador.classList.add('active');

      tituloCanal.textContent = 'Chat privado con Facilitador (Scrum Master)';

      cargarMensajes();
    });
  }

  // Carga inicial de mensajes por defecto (Canal 1)
  cargarMensajes();
});