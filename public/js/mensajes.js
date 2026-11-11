document.addEventListener("DOMContentLoaded", () => {
    const usuarioString = sessionStorage.getItem('usuarioActivo');
    const proyectoString = sessionStorage.getItem('proyectoActivo');

    if (!usuarioString || !proyectoString) return;

    const usuarioActivo = JSON.parse(usuarioString);
    const proyectoActivo = JSON.parse(proyectoString);

    const idUsuarioActual = usuarioActivo.id;
    const idProyectoActual = proyectoActivo.id;

    let canalActualId = null;
    let usuarioDestinoId = null;

    const listaCanales = document.getElementById('listaCanalesGeneral');
    const listaContactos = document.getElementById('listaContactosGeneral');
    const contenedorMensajes = document.getElementById('contenedorMensajesGeneral');
    const inputMensaje = document.getElementById('inputMensajeGeneral');
    const btnEnviar = document.getElementById('btnEnviarMensajeGeneral');
    const tituloChat = document.getElementById('tituloChatActual');
    const subInfoChat = document.getElementById('subInfoChat');

    // 1. Cargar Canales del Proyecto
    async function cargarCanales() {
        try {
            const res = await fetch(`/api/mensajes/canales/${idProyectoActual}`);
            const data = await res.json();

            if (listaCanales) listaCanales.innerHTML = '';
            
            const canales = Array.isArray(data) ? data : (data.canales || []);

            canales.forEach((canal, index) => {
                const div = document.createElement('div');
                div.className = 'elemento-item';
                div.innerHTML = `${canal.nombre}`;
                div.onclick = () => seleccionarCanal(canal);
                listaCanales.appendChild(div);

                if (index === 0 && !canalActualId && !usuarioDestinoId) {
                    seleccionarCanal(canal);
                }
            });
        } catch (error) {
            console.error("Error al cargar canales:", error);
        }
    }

    // 2. Cargar Contactos Directos
    async function cargarContactos() {
        try {
            const res = await fetch(`/usuarios/scrumbird/${idProyectoActual}`);
            const json = await res.json();
            const usuarios = json.data || [];

            if (listaContactos) listaContactos.innerHTML = '';
            
            window.mapaUsuarios = {}; 

            usuarios.forEach(u => {
                const nombreUsuario = u.u_nombre || 'Usuario';
                window.mapaUsuarios[u.id] = nombreUsuario;

                if (u.id !== idUsuarioActual) {
                    const div = document.createElement('div');
                    div.className = 'elemento-item';
                    div.innerHTML = `<span>👤 ${nombreUsuario}</span>`;
                    div.onclick = () => seleccionarContacto(u);
                    listaContactos.appendChild(div);
                }
            });
        } catch (error) {
            console.error("Error al cargar contactos:", error);
        }
    }

    // 3. Función Única de Renderizado de Mensajes (con nombres reales)
    function renderizarMensajes(mensajes) {
        if (!contenedorMensajes) return;
        contenedorMensajes.innerHTML = '';

        if (!Array.isArray(mensajes) || mensajes.length === 0) {
            contenedorMensajes.innerHTML = '<p style="color: #94a3b8; text-align: center;">No hay mensajes aquí todavía. ¡Escribe el primero!</p>';
            return;
        }

        // Mapa de respaldo directo por si acaso
        const nombresDirectos = {
            1: 'Ana Pérez',
            2: 'Carlos Gómez',
            3: 'Sofía Ruiz',
            5: 'rubi'
        };

        mensajes.forEach(msg => {
            const esMio = msg.id_autor === idUsuarioActual;
            
            let nombreAutor = 'Compañero';
            if (esMio) {
                nombreAutor = 'Tú';
            } else if (window.mapaUsuarios && window.mapaUsuarios[msg.id_autor]) {
                nombreAutor = window.mapaUsuarios[msg.id_autor];
            } else if (nombresDirectos[msg.id_autor]) {
                nombreAutor = nombresDirectos[msg.id_autor];
            }

            const burbuja = document.createElement('div');
            burbuja.className = `burbuja ${esMio ? 'enviada' : 'recibida'}`;
            burbuja.innerHTML = `
                <span class="remitente">${nombreAutor}</span>
                <p>${msg.mensaje}</p>
            `;
            contenedorMensajes.appendChild(burbuja);
        });
        contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
    }

    function seleccionarCanal(canal) {
        document.querySelectorAll('.elemento-item').forEach(el => el.classList.remove('activo'));
        canalActualId = canal.id;
        usuarioDestinoId = null;

        if (tituloChat) tituloChat.textContent = canal.nombre;
        if (subInfoChat) subInfoChat.textContent = canal.descripcion || 'Canal del proyecto';
        
        cargarMensajesCanal(canal.id);
    }

    function seleccionarContacto(contacto) {
        document.querySelectorAll('.elemento-item').forEach(el => el.classList.remove('activo'));
        canalActualId = null;
        usuarioDestinoId = contacto.id;

        if (tituloChat) tituloChat.textContent = contacto.u_nombre || contacto.nombre || contacto.nombre_de_usuario;
        if (subInfoChat) subInfoChat.textContent = 'Mensaje privado';

        cargarMensajesPrivados(contacto.id);
    }

    async function cargarMensajesCanal(idCanal) {
        try {
            const res = await fetch(`/api/mensajes/canales/mensajes/${idCanal}`);
            const data = await res.json();
            renderizarMensajes(data.mensajes || data || []);
        } catch (error) {
            console.error("Error al cargar mensajes de canal:", error);
        }
    }

    async function cargarMensajesPrivados(idDestino) {
        try {
            const res = await fetch(`/api/mensajes/privados?idUsuario1=${idUsuarioActual}&idUsuario2=${idDestino}`);
            const data = await res.json();
            renderizarMensajes(data.mensajes || data || []);
        } catch (error) {
            console.error("Error al cargar mensajes privados:", error);
        }
    }

    async function enviarMensaje() {
        const texto = inputMensaje.value.trim();
        if (!texto) return;

        if (canalActualId) {
            await fetch('/api/mensajes/canales/mensajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idAutor: idUsuarioActual, idCanal: canalActualId, mensaje: texto })
            });
            inputMensaje.value = '';
            cargarMensajesCanal(canalActualId);
        } else if (usuarioDestinoId) {
            await fetch('/api/mensajes/privados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idAutor: idUsuarioActual, idUsuarioDestino: usuarioDestinoId, mensaje: texto })
            });
            inputMensaje.value = '';
            cargarMensajesPrivados(usuarioDestinoId);
        }
    }

    if (btnEnviar) btnEnviar.addEventListener('click', enviarMensaje);
    if (inputMensaje) {
        inputMensaje.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enviarMensaje();
        });
    }

    cargarCanales();
    cargarContactos();
});

// --- LÓGICA DEL BOTÓN E INICIO DE CONVERSACIÓN ---
    const btnIniciarConversacion = document.getElementById('btnIniciarConversacion');
    const modalNuevoChat = document.getElementById('modalNuevoChat');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const listaContactosModal = document.getElementById('listaContactosModal');

    if (btnIniciarConversacion && modalNuevoChat) {
        btnIniciarConversacion.addEventListener('click', async () => {
            modalNuevoChat.style.display = 'flex';
            await cargarMiembrosEnModal();
        });
    }

    if (btnCerrarModal && modalNuevoChat) {
        btnCerrarModal.addEventListener('click', () => {
            modalNuevoChat.style.display = 'none';
        });
    }

    // Cargar usuarios en la lista del modal
    async function cargarMiembrosEnModal() {
        try {
            const res = await fetch(`/usuarios/scrumbird/${idProyectoActual}`);
            const json = await res.json();
            const usuarios = json.data || [];

            if (listaContactosModal) listaContactosModal.innerHTML = '';

            const otrosUsuarios = usuarios.filter(u => u.id !== idUsuarioActual);

            if (otrosUsuarios.length === 0) {
                listaContactosModal.innerHTML = '<p style="padding: 10px; text-align: center; color: #94a3b8;">No hay más miembros en este proyecto.</p>';
                return;
            }

            otrosUsuarios.forEach(contacto => {
                const div = document.createElement('div');
                div.className = 'item-contacto-modal';
                div.innerHTML = `👤 ${contacto.u_nombre || contacto.nombre}`;
                div.onclick = () => {
                    modalNuevoChat.style.display = 'none';
                    seleccionarContacto(contacto); // Activa el chat privado con este usuario
                };
                listaContactosModal.appendChild(div);
            });
        } catch (error) {
            console.error("Error al cargar miembros para nuevo chat:", error);
        }
    }