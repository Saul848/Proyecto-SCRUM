
/* ==========================================
   MÓDULO DE MENSAJERÍA - SCRUMBIRD
   Mensajes privados, canales y grupos
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // 1. USUARIO Y PROYECTO ACTUALES

    function leerSesion(clave) {
        try {
            return JSON.parse(sessionStorage.getItem(clave));
        } catch {
            return null;
        }
    }

    const usuarioActivo = leerSesion("usuarioActivo");
    const proyectoActivo = leerSesion("proyectoActivo");

    const idUsuarioActual = Number(usuarioActivo?.id);
    const idProyectoActual = Number(proyectoActivo?.id);

    if (!idUsuarioActual || !idProyectoActual) {
        console.warn("No hay usuario o proyecto activo.");
        return;
    }

    // 2. ELEMENTOS DEL CHAT

    const listaCanales = document.getElementById("listaCanalesGeneral");
    const listaContactos =
        document.getElementById("listaContactosDirectos") ||
        document.getElementById("listaContactosGeneral");
    const contenedorMensajes = document.getElementById("contenedorMensajesGeneral");
    const inputMensaje = document.getElementById("inputMensajeGeneral");
    const btnEnviar = document.getElementById("btnEnviarMensajeGeneral");
    const tituloChat = document.getElementById("tituloChatActual");
    const subInfoChat = document.getElementById("subInfoChat");

    // Elementos del modal de nueva conversación
    const btnIniciarConversacion = document.getElementById("btnIniciarConversacion");
    const modalNuevoChat = document.getElementById("modalNuevoChat");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const listaContactosModal = document.getElementById("listaContactosModal");

    // 3. ESTADO ÚNICO DE CONVERSACIÓN

    let conversacionActual = null;
    let versionConversacion = 0;
    let enviandoMensaje = false;

    const mapaUsuarios = new Map();
    let contactosProyecto = [];

    // 4. FUNCIONES AUXILIARES

    async function solicitarJSON(url, opciones = {}) {
        const respuesta = await fetch(url, opciones);
        const datos = await respuesta.json();

        if (
            !respuesta.ok ||
            datos.success === false ||
            datos.ok === false
        ) {
            throw new Error(
                datos.message ||
                datos.mensaje ||
                "No se pudo completar la operación."
            );
        }

        return datos;
    }

    function obtenerLista(datos, propiedad) {
        if (Array.isArray(datos)) return datos;
        if (Array.isArray(datos[propiedad])) {
            return datos[propiedad];
        }
        if (Array.isArray(datos.data)) {
            return datos.data;
        }
        return [];
    }

    function mostrarAviso(texto) {
        if (!contenedorMensajes) return;

        contenedorMensajes.replaceChildren();

        const aviso = document.createElement("p");
        aviso.textContent = texto;
        aviso.style.color = "#94a3b8";
        aviso.style.textAlign = "center";
        aviso.style.padding = "20px";

        contenedorMensajes.appendChild(aviso);
    }

    function quitarSeleccionVisual() {
        document.querySelectorAll(
            "#modal-mensajes .elemento-item, " +
            "#modal-mensajes .opcion-contacto, " +
            "#modal-mensajes .grupos-tarjeta"
        ).forEach(elemento => {
            elemento.classList.remove("activo");
        });
    }

    function activarConversacion(tipo, id, nombre, descripcion) {
        const identificador = Number(id);

        if (!Number.isInteger(identificador) || identificador <= 0) {
            console.error("Identificador de conversación inválido.");
            return false;
        }

        versionConversacion++;

        conversacionActual = {
            tipo,
            id: identificador,
            nombre
        };

        // Solo los grupos mantienen esta selección.
        if (tipo !== "grupo") {
            window.grupoSeleccionadoMensajes = null;
        }

        quitarSeleccionVisual();

        if (tituloChat) {
            tituloChat.textContent =
                tipo === "canal" ? `#${nombre}` : nombre;
        }

        if (subInfoChat) {
            subInfoChat.textContent = descripcion;
        }

        mostrarAviso("Cargando mensajes...");

        cargarMensajesActuales();

        return true;
    }

    // 5. CARGAR CONTACTOS REALES DEL PROYECTO

    async function cargarContactos() {
        try {
            const datos = await solicitarJSON(
                `/proyectos/contactos-proyecto/` +
                `${idProyectoActual}/${idUsuarioActual}`
            );

            contactosProyecto = obtenerLista(datos, "contactos");

            mapaUsuarios.clear();

            mapaUsuarios.set(
                idUsuarioActual,
                usuarioActivo.nombre ||
                usuarioActivo.u_nombre ||
                usuarioActivo.nombre_de_usuario ||
                "Tú"
            );

            contactosProyecto.forEach(contacto => {
                mapaUsuarios.set(
                    Number(contacto.id),
                    contacto.nombre ||
                    contacto.u_nombre ||
                    contacto.nombre_de_usuario ||
                    "Compañero"
                );
            });

            if (!listaContactos) return;

            listaContactos.replaceChildren();

            const disponibles = contactosProyecto.filter(
                contacto => Number(contacto.id) !== idUsuarioActual
            );

            if (disponibles.length === 0) {
                const aviso = document.createElement("p");
                aviso.textContent = "No hay otros contactos.";
                listaContactos.appendChild(aviso);
                return;
            }

            disponibles.forEach(contacto => {
                const elemento = document.createElement("div");
                elemento.className = "opcion-contacto elemento-item";

                const nombre = document.createElement("span");
                nombre.textContent =
                    `👤 ${contacto.nombre || "Compañero"}`;

                const rol = document.createElement("small");
                rol.textContent = ` (${contacto.rol || "Miembro"})`;

                elemento.append(nombre, rol);

                elemento.addEventListener("click", () => {
                    seleccionarContacto(contacto);
                    elemento.classList.add("activo");
                });

                listaContactos.appendChild(elemento);
            });

        } catch (error) {
            console.error("Error al cargar contactos:", error);
        }
    }

    // 6. CARGAR CANALES DEL PROYECTO

    async function cargarCanales() {
        try {
            const datos = await solicitarJSON(
                `/api/mensajes/canales/${idProyectoActual}`
            );

            const canales = obtenerLista(datos, "canales");

            if (!listaCanales) return;

            listaCanales.replaceChildren();

            canales.forEach(canal => {
                const elemento = document.createElement("div");
                elemento.className = "elemento-item";
                elemento.textContent = `# ${canal.nombre}`;

                elemento.addEventListener("click", () => {
                    seleccionarCanal(canal);
                    elemento.classList.add("activo");
                });

                listaCanales.appendChild(elemento);
            });

        } catch (error) {
            console.error("Error al cargar canales:", error);
        }
    }

    // 7. SELECCIONAR CONTACTO

    function seleccionarContacto(contacto) {
        const nombre =
            contacto.nombre ||
            contacto.u_nombre ||
            contacto.nombre_de_usuario ||
            "Compañero";

        activarConversacion(
            "privado",
            contacto.id,
            nombre,
            "Mensaje privado"
        );
    }

    // 8. SELECCIONAR CANAL

    function seleccionarCanal(canal) {
        activarConversacion(
            "canal",
            canal.id,
            canal.nombre,
            canal.descripcion || "Canal del proyecto"
        );
    }

    // 9. SELECCIONAR GRUPO

    window.seleccionarGrupoMensajes = function(grupo) {
        const activado = activarConversacion(
            "grupo",
            grupo.id,
            grupo.nombre,
            grupo.descripcion || "Conversación grupal"
        );

        if (!activado) return;

        // Se conserva para el botón "Ver detalles".
        window.grupoSeleccionadoMensajes = {
            id: grupo.id,
            nombre: grupo.nombre,
            administrador: grupo.administrador
        };

        console.log("Chat grupal activado:", grupo.nombre);
    };

    // 10. CONSULTAR HISTORIAL

    async function cargarMensajesActuales() {
        if (!conversacionActual) return;

        const conversacion = { ...conversacionActual };
        const version = versionConversacion;

        let url;

        switch (conversacion.tipo) {
            case "privado":
                url =
                    `/api/mensajes/privados?` +
                    `idUsuario1=${idUsuarioActual}` +
                    `&idUsuario2=${conversacion.id}`;
                break;

            case "canal":
                url =
                    `/api/mensajes/canales/mensajes/` +
                    conversacion.id;
                break;

            case "grupo":
                url =
                    `/api/mensajes/grupos/mensajes/` +
                    `${conversacion.id}?idUsuario=${idUsuarioActual}`;
                break;

            default:
                return;
        }

        try {
            const datos = await solicitarJSON(url);

            // No mostrar respuestas de chats anteriores.
            if (version !== versionConversacion) return;

            const mensajes = obtenerLista(datos, "mensajes");
            renderizarMensajes(mensajes);

        } catch (error) {
            if (version !== versionConversacion) return;

            console.error("Error al cargar mensajes:", error);
            mostrarAviso("No se pudieron cargar los mensajes.");
        }
    }

    // 11. MOSTRAR MENSAJES

    function renderizarMensajes(mensajes) {
        if (!contenedorMensajes) return;

        contenedorMensajes.replaceChildren();

        if (!mensajes.length) {
            mostrarAviso(
                "No hay mensajes todavía. ¡Inicia la conversación!"
            );
            return;
        }

        mensajes.forEach(msg => {
            const esMio =
                Number(msg.id_autor) === idUsuarioActual;

            const nombreAutor = esMio
                ? "Tú"
                : (
                    msg.nombre_autor ||
                    mapaUsuarios.get(Number(msg.id_autor)) ||
                    msg.nombre_de_usuario ||
                    "Compañero"
                );

            const burbuja = document.createElement("div");

            burbuja.className =
                `burbuja ${esMio ? "enviada" : "recibida"}`;

            const remitente = document.createElement("span");
            remitente.className = "remitente";
            remitente.textContent = nombreAutor;

            const contenido = document.createElement("p");
            contenido.textContent = msg.mensaje || "";

            burbuja.append(remitente, contenido);
            contenedorMensajes.appendChild(burbuja);
        });

        contenedorMensajes.scrollTop =
            contenedorMensajes.scrollHeight;
    }

    // 12. ENVIAR MENSAJES

    async function enviarMensaje() {
        if (!inputMensaje || enviandoMensaje) return;

        const texto = inputMensaje.value.trim();

        if (!texto || !conversacionActual) return;

        const conversacion = { ...conversacionActual };
        const version = versionConversacion;

        let url;
        let cuerpo;

        switch (conversacion.tipo) {
            case "privado":
                url = "/api/mensajes/privados";
                cuerpo = {
                    idAutor: idUsuarioActual,
                    idUsuarioDestino: conversacion.id,
                    mensaje: texto
                };
                break;

            case "canal":
                url = "/api/mensajes/canales/mensajes";
                cuerpo = {
                    idAutor: idUsuarioActual,
                    idCanal: conversacion.id,
                    mensaje: texto
                };
                break;

            case "grupo":
                url = "/api/mensajes/grupos/mensajes";
                cuerpo = {
                    idAutor: idUsuarioActual,
                    idGrupoDestino: conversacion.id,
                    mensaje: texto
                };
                break;

            default:
                return;
        }

        enviandoMensaje = true;

        if (btnEnviar) btnEnviar.disabled = true;

        try {
            await solicitarJSON(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(cuerpo)
            });

            // Evitar borrar texto escrito en otro chat.
            if (
                version === versionConversacion &&
                inputMensaje.value.trim() === texto
            ) {
                inputMensaje.value = "";
            }

            if (version === versionConversacion) {
                await cargarMensajesActuales();
            }

        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            alert(error.message || "No se pudo enviar el mensaje.");

        } finally {
            enviandoMensaje = false;
            if (btnEnviar) btnEnviar.disabled = false;
        }
    }

    // 13. EVENTOS DE ENVÍO

    if (btnEnviar) {
        btnEnviar.addEventListener("click", enviarMensaje);
    }

    if (inputMensaje) {
        inputMensaje.addEventListener("keydown", evento => {
            if (evento.key === "Enter" && !evento.shiftKey) {
                evento.preventDefault();
                enviarMensaje();
            }
        });
    }

    // 14. MODAL DE NUEVA CONVERSACIÓN

    async function cargarMiembrosEnModal() {
        if (!listaContactosModal) return;

        listaContactosModal.replaceChildren();

        try {
            const datos = await solicitarJSON(
                `/proyectos/contactos-proyecto/` +
                `${idProyectoActual}/${idUsuarioActual}`
            );

            const contactos = obtenerLista(datos, "contactos");

            const disponibles = contactos.filter(
                contacto => Number(contacto.id) !== idUsuarioActual
            );

            if (!disponibles.length) {
                const aviso = document.createElement("p");
                aviso.textContent =
                    "No hay más miembros en este proyecto.";
                listaContactosModal.appendChild(aviso);
                return;
            }

            disponibles.forEach(contacto => {
                const elemento = document.createElement("div");
                elemento.className = "item-contacto-modal";
                elemento.textContent =
                    `👤 ${contacto.nombre || "Compañero"}`;

                elemento.addEventListener("click", () => {
                    if (modalNuevoChat) {
                        modalNuevoChat.style.display = "none";
                    }

                    seleccionarContacto(contacto);

                    // Resaltar el contacto en la lista principal.
                    if (listaContactos) {
                        const elementos =
                            listaContactos.querySelectorAll(
                                ".elemento-item"
                            );

                        elementos.forEach(elemento => {
                            if (
                                elemento.textContent.includes(
                                    contacto.nombre
                                )
                            ) {
                                elemento.classList.add("activo");
                            }
                        });
                    }
                });

                listaContactosModal.appendChild(elemento);
            });

        } catch (error) {
            console.error("Error al cargar el modal:", error);
        }
    }

    if (btnIniciarConversacion && modalNuevoChat) {
        btnIniciarConversacion.addEventListener("click", async () => {
            modalNuevoChat.style.display = "flex";
            await cargarMiembrosEnModal();
        });
    }

    if (btnCerrarModal && modalNuevoChat) {
        btnCerrarModal.addEventListener("click", () => {
            modalNuevoChat.style.display = "none";
        });
    }

    // 15. INICIALIZACIÓN

    cargarContactos();
    cargarCanales();

    console.log("Módulo de mensajería inicializado.");
});
