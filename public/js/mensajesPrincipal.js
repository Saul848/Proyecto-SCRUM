
/**
 * Mensajería privada del Panel Principal
 * Historia de usuario: PB-63
 */

document.addEventListener("DOMContentLoaded", () => {

    const btnMensajes = document.getElementById("btn-mensajes");
    const listaUsuarios = document.getElementById("listaContactosDirectos");
    const buscador = document.getElementById("inputBuscarChat");
    const tituloChat = document.getElementById("tituloChatActual");
    const subtituloChat = document.getElementById("subInfoChat");
    const contenedorMensajes = document.getElementById("contenedorMensajesGeneral");
    const inputMensaje = document.getElementById("inputMensajeGeneral");
    const btnEnviar = document.getElementById("btnEnviarMensajeGeneral");

    const usuarioActivo = JSON.parse(
        sessionStorage.getItem("usuarioActivo") || "null"
    );

    const idUsuarioActual = Number(usuarioActivo?.id);

    let usuarios = [];
    let contactoSeleccionado = null;
    let versionConversacion = 0;
    let enviando = false;

    if (!btnMensajes || !listaUsuarios) return;

    // ==========================================
    // 1. FUNCIONES AUXILIARES
    // ==========================================

    async function solicitarJSON(url, opciones = {}) {
        const respuesta = await fetch(url, opciones);
        const datos = await respuesta.json();

        if (!respuesta.ok || datos.success === false || datos.ok === false) {
            throw new Error(
                datos.message ||
                datos.mensaje ||
                "Ocurrió un error en la solicitud."
            );
        }

        return datos;
    }

    function obtenerNombre(usuario) {
        return usuario.nombre ||
            usuario.nombre_de_usuario ||
            `Usuario ${usuario.id}`;
    }

    function mostrarAviso(texto) {
        contenedorMensajes.replaceChildren();

        const aviso = document.createElement("p");
        aviso.textContent = texto;
        aviso.style.textAlign = "center";
        aviso.style.padding = "20px";
        aviso.style.color = "#64748b";

        contenedorMensajes.appendChild(aviso);
    }

    // ==========================================
    // 2. CONSULTAR USUARIOS REGISTRADOS
    // ==========================================

    async function cargarUsuarios() {
        if (!idUsuarioActual) {
            listaUsuarios.textContent = "Inicia sesión para ver los usuarios.";
            return;
        }

        listaUsuarios.textContent = "Cargando usuarios...";

        try {
            const datos = await solicitarJSON("/usuarios");

            const lista = Array.isArray(datos)
                ? datos
                : Array.isArray(datos.data)
                    ? datos.data
                    : Array.isArray(datos.usuarios)
                        ? datos.usuarios
                        : [];

            usuarios = lista.filter(
                usuario => Number(usuario.id) !== idUsuarioActual
            );

            mostrarUsuarios(usuarios);

        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            listaUsuarios.textContent = "No se pudieron cargar los usuarios.";
        }
    }

    function mostrarUsuarios(lista) {
        listaUsuarios.replaceChildren();

        if (lista.length === 0) {
            listaUsuarios.textContent = "No se encontraron usuarios.";
            return;
        }

        lista.forEach(usuario => {
            const elemento = document.createElement("div");
            elemento.className = "elemento-item opcion-contacto";

            const nombre = document.createElement("span");
            nombre.textContent = `👤 ${obtenerNombre(usuario)}`;

            elemento.appendChild(nombre);

            if (Number(contactoSeleccionado?.id) === Number(usuario.id)) {
                elemento.classList.add("activo");
            }

            elemento.addEventListener("click", () => {
                seleccionarContacto(usuario);
                mostrarUsuarios(
                    usuarios.filter(u =>
                        obtenerNombre(u).toLowerCase().includes(
                            buscador?.value.trim().toLowerCase() || ""
                        )
                    )
                );
            });

            listaUsuarios.appendChild(elemento);
        });
    }

    // ==========================================
    // 3. SELECCIONAR CONVERSACIÓN
    // ==========================================

    function seleccionarContacto(usuario) {
        contactoSeleccionado = usuario;
        versionConversacion++;

        tituloChat.textContent = obtenerNombre(usuario);
        subtituloChat.textContent = "Conversación privada";

        mostrarAviso("Cargando mensajes...");
        cargarMensajes();
    }

    // ==========================================
    // 4. CONSULTAR HISTORIAL
    // ==========================================

    async function cargarMensajes() {
        if (!contactoSeleccionado) return;

        const idDestino = Number(contactoSeleccionado.id);
        const version = versionConversacion;

        try {
            const datos = await solicitarJSON(
                `/api/mensajes/privados?idUsuario1=${idUsuarioActual}&idUsuario2=${idDestino}`
            );

            if (version !== versionConversacion) return;

            renderizarMensajes(datos.mensajes || []);

        } catch (error) {
            if (version !== versionConversacion) return;

            console.error("Error al cargar mensajes:", error);
            mostrarAviso("No se pudo cargar el historial.");
        }
    }

    function renderizarMensajes(mensajes) {
        contenedorMensajes.replaceChildren();

        if (!mensajes.length) {
            mostrarAviso("No hay mensajes todavía. ¡Inicia la conversación!");
            return;
        }

        mensajes.forEach(msg => {
            const esMio = Number(msg.id_autor) === idUsuarioActual;

            const burbuja = document.createElement("div");
            burbuja.className =
                `burbuja ${esMio ? "enviada" : "recibida"}`;

            const remitente = document.createElement("span");
            remitente.className = "remitente";
            remitente.textContent = esMio
                ? "Tú"
                : obtenerNombre(contactoSeleccionado);

            const contenido = document.createElement("p");
            contenido.textContent = msg.mensaje || "";

            burbuja.append(remitente, contenido);
            contenedorMensajes.appendChild(burbuja);
        });

        contenedorMensajes.scrollTop =
            contenedorMensajes.scrollHeight;
    }

    // ==========================================
    // 5. ENVIAR MENSAJE PRIVADO
    // ==========================================

    async function enviarMensaje() {
        const texto = inputMensaje.value.trim();

        if (!texto || !contactoSeleccionado || enviando) return;

        const version = versionConversacion;
        const idDestino = Number(contactoSeleccionado.id);

        enviando = true;
        btnEnviar.disabled = true;

        try {
            await solicitarJSON("/api/mensajes/privados", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idAutor: idUsuarioActual,
                    idUsuarioDestino: idDestino,
                    mensaje: texto
                })
            });

            if (version === versionConversacion) {
                if (inputMensaje.value.trim() === texto) {
                    inputMensaje.value = "";
                }

                await cargarMensajes();
            }

        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            alert(error.message || "No se pudo enviar el mensaje.");

        } finally {
            enviando = false;
            btnEnviar.disabled = false;
        }
    }

    // ==========================================
    // 6. EVENTOS
    // ==========================================

    btnMensajes.addEventListener("click", async () => {
        mostrarModalP("modal-mensajes");

        if (!idUsuarioActual) {
            mostrarAviso("No se encontró una sesión activa.");
            return;
        }

        await cargarUsuarios();
    });

    buscador?.addEventListener("input", () => {
        const busqueda = buscador.value.trim().toLowerCase();

        const filtrados = usuarios.filter(usuario =>
            obtenerNombre(usuario).toLowerCase().includes(busqueda)
        );

        mostrarUsuarios(filtrados);
    });

    btnEnviar?.addEventListener("click", enviarMensaje);

    inputMensaje?.addEventListener("keydown", evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            enviarMensaje();
        }
    });

    console.log("Mensajería privada del Panel Principal inicializada.");
});
