/* ==========================================
   MÓDULO DE GRUPOS - SCRUMBIRD
   ========================================== */

function inicializarGrupos() {

    const modal = document.getElementById('modalCrearGrupo');
    const btnAbrir = document.getElementById('btnCrearGrupo')
    || document.getElementById('btnAbrirCrearGrupo');
    const btnCerrar = document.getElementById('btnCerrarCrearGrupo');
    const btnCancelar = document.getElementById('btnCancelarCrearGrupo');

    const formulario = document.getElementById('formCrearGrupo');
    const listaContactos = document.getElementById('listaContactosGrupo');
    const listaGrupos = document.getElementById('listaGrupos');
    const mensaje = document.getElementById('mensajeCrearGrupo');

    const btnGuardar = formulario.querySelector('button[type="submit"]');
    
    // Elementos del modal de participantes
    const modalParticipantes = document.getElementById('modalParticipantesGrupo');
    const btnCerrarParticipantes = document.getElementById('btnCerrarParticipantes');
    const btnVolverParticipantes = document.getElementById('btnVolverParticipantes');
    const tituloParticipantes = document.getElementById('tituloParticipantesGrupo');
    const listaParticipantes = document.getElementById('listaParticipantesGrupo');
    const mensajeParticipantes = document.getElementById('mensajeParticipantesGrupo');

    let idGrupoSeleccionado = null;
    let administradorGrupoSeleccionado = false;
    
    // Elementos del modal para agregar participantes
    const modalAgregar = document.getElementById('modalAgregarParticipantes');
    const btnAbrirAgregar = document.getElementById('btnAbrirAgregarParticipantes');
    const btnCerrarAgregar = document.getElementById('btnCerrarAgregarParticipantes');
    const btnCancelarAgregar = document.getElementById('btnCancelarAgregarParticipantes');

    const formAgregar = document.getElementById('formAgregarParticipantes');
    const listaContactosAgregar = document.getElementById('listaContactosAgregar');
    const mensajeAgregar = document.getElementById('mensajeAgregarParticipantes');
    const nombreGrupoAgregar = document.getElementById('nombreGrupoAgregar');
    const btnGuardarParticipantes = document.getElementById('btnGuardarParticipantes');

    let nombreGrupoSeleccionado = '';



    // Obtener usuario y proyecto activos
    function leerSesion(clave) {
        try {
            return JSON.parse(sessionStorage.getItem(clave));
        } catch {
            return null;
        }
    }

    const usuarioActual = leerSesion('usuarioActivo');
    const proyectoActual = leerSesion('proyectoActivo');

    const idUsuario = Number(usuarioActual?.id);
    const idProyecto = Number(proyectoActual?.id);

    function sesionValida() {
        return Number.isInteger(idUsuario) && idUsuario > 0 &&
               Number.isInteger(idProyecto) && idProyecto > 0;
    }

    function mostrarMensaje(texto, tipo = '') {
        mensaje.textContent = texto;
        mensaje.className = tipo;
    }

    // Abrir el modal
    async function abrirModal() {
        if (!sesionValida()) {
            alert('Primero inicia sesión y selecciona un proyecto.');
            return;
        }

        formulario.reset();
        mostrarMensaje('');
        modal.hidden = false;

        await cargarContactos();
    }

    // Cerrar el modal
    function cerrarModal() {
        modal.hidden = true;
        formulario.reset();
        mostrarMensaje('');
    }

    btnAbrir.addEventListener('click', abrirModal);
    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del formulario
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) {
            cerrarModal();
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.hidden) {
            cerrarModal();
        }
    });

    /* ==========================================
       CARGAR CONTACTOS DEL PROYECTO
       ========================================== */

    async function cargarContactos() {
        listaContactos.replaceChildren();

        const cargando = document.createElement('p');
        cargando.textContent = 'Cargando contactos...';
        listaContactos.appendChild(cargando);

        try {
            const respuesta = await fetch(
                `/proyectos/contactos-proyecto/${idProyecto}/${idUsuario}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error('No se pudieron obtener los contactos.');
            }

            listaContactos.replaceChildren();

            const contactos = Array.isArray(datos.contactos)
                ? datos.contactos
                : [];

            // El creador se agrega automáticamente desde el backend.
            const disponibles = contactos.filter(
                contacto => Number(contacto.id) !== idUsuario
            );

            if (disponibles.length === 0) {
                const aviso = document.createElement('p');
                aviso.textContent = 'No hay otros contactos disponibles en este proyecto.';
                listaContactos.appendChild(aviso);
                return;
            }

            disponibles.forEach(contacto => {

                const etiqueta = document.createElement('label');
                etiqueta.className = 'grupos-contacto';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = contacto.id;
                checkbox.name = 'participantesGrupo';

                const informacion = document.createElement('span');
                informacion.className = 'grupos-contacto-info';

                const nombre = document.createElement('strong');
                nombre.textContent = contacto.nombre;

                const rol = document.createElement('small');
                rol.textContent = contacto.rol || 'Miembro';

                informacion.append(nombre, rol);
                etiqueta.append(checkbox, informacion);
                listaContactos.appendChild(etiqueta);
            });

        } catch (error) {
            console.error('Error al cargar contactos:', error);

            listaContactos.replaceChildren();

            const aviso = document.createElement('p');
            aviso.textContent = 'Error al cargar los contactos del proyecto.';
            listaContactos.appendChild(aviso);
        }
    }

    /* ==========================================
       CREAR GRUPO
       ========================================== */

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (!sesionValida()) {
            mostrarMensaje('No hay un usuario o proyecto activo.', 'error');
            return;
        }

        const nombre = document.getElementById('nombreGrupo').value.trim();
        const descripcion = document.getElementById('descripcionGrupo').value.trim();

        const participantes = Array.from(
            formulario.querySelectorAll(
                'input[name="participantesGrupo"]:checked'
            )
        ).map(checkbox => Number(checkbox.value));

        if (!nombre) {
            mostrarMensaje('Escribe un nombre para el grupo.', 'error');
            return;
        }

        if (participantes.length === 0) {
            mostrarMensaje('Selecciona al menos un participante.', 'error');
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Creando grupo...';
        mostrarMensaje('');

        try {
            const respuesta = await fetch('/grupos/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idProyecto,
                    idCreador: idUsuario,
                    nombre,
                    descripcion,
                    participantes
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || 'No se pudo crear el grupo.'
                );
            }

            mostrarMensaje('¡Grupo creado correctamente!', 'exito');

            await cargarGrupos();

            // Cerrar únicamente después de una creación exitosa.
            cerrarModal();

            alert('¡Grupo creado correctamente!');

        } catch (error) {
            console.error('Error al crear grupo:', error);
            mostrarMensaje(error.message, 'error');

        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Crear grupo';
        }
    });

    /* ==========================================
       MOSTRAR GRUPOS DEL USUARIO
       ========================================== */

    async function cargarGrupos() {
        listaGrupos.replaceChildren();

        if (!sesionValida()) {
            const aviso = document.createElement('p');
            aviso.textContent =
                'Inicia sesión y selecciona un proyecto para consultar tus grupos.';
            listaGrupos.appendChild(aviso);
            return;
        }

        try {
            const respuesta = await fetch(
                `/grupos/usuario/${idUsuario}/proyecto/${idProyecto}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error('No se pudieron cargar los grupos.');
            }

            listaGrupos.replaceChildren();

            const grupos = Array.isArray(datos.data)
                ? datos.data
                : [];

            if (grupos.length === 0) {
                const aviso = document.createElement('p');
                aviso.textContent =
                    'Todavía no perteneces a ningún grupo de este proyecto.';
                listaGrupos.appendChild(aviso);
                return;
            }

            grupos.forEach(grupo => {

                const tarjeta = document.createElement('article');
                tarjeta.className = 'grupos-tarjeta';

                const titulo = document.createElement('h3');
                titulo.textContent = grupo.nombre;

                const descripcion = document.createElement('p');
                descripcion.textContent =
                    grupo.descripcion || 'Sin descripción';

                const rol = document.createElement('p');
                rol.textContent = grupo.administrador
                    ? 'Rol: Administrador del grupo'
                    : 'Rol: Participante';

                
                const btnVerParticipantes = document.createElement('button');
                btnVerParticipantes.type = 'button';
                btnVerParticipantes.className = 'grupos-btn-ver';
                btnVerParticipantes.textContent = 'Ver participantes';

                btnVerParticipantes.addEventListener('click', () => {
                    abrirModalParticipantes(
                        grupo.id,
                        grupo.nombre,
                        grupo.administrador
                    );
                });

                tarjeta.append(
                    titulo,
                    descripcion,
                    rol,
                    btnVerParticipantes
                );

                listaGrupos.appendChild(tarjeta);

            });

        } catch (error) {
            console.error('Error al cargar grupos:', error);

            listaGrupos.replaceChildren();

            const aviso = document.createElement('p');
            aviso.textContent = 'Ocurrió un error al consultar tus grupos.';
            listaGrupos.appendChild(aviso);
        }
    }
    
    /* ==========================================
       ADMINISTRACIÓN DE PARTICIPANTES
       ========================================== */

    function mostrarMensajeParticipantes(texto, tipo = '') {
        mensajeParticipantes.textContent = texto;
        mensajeParticipantes.className = tipo;
    }

    async function abrirModalParticipantes(idGrupo, nombreGrupo, esAdministrador) {
        idGrupoSeleccionado = Number(idGrupo);
        administradorGrupoSeleccionado = esAdministrador === true;
        nombreGrupoSeleccionado = nombreGrupo;
        // Solo el administrador puede agregar integrantes
        btnAbrirAgregar.hidden = !administradorGrupoSeleccionado;


        tituloParticipantes.textContent = `Participantes de ${nombreGrupo}`;
        mostrarMensajeParticipantes('');

        modalParticipantes.hidden = false;

        await cargarParticipantes();
    }

    function cerrarModalParticipantes() {
        modalParticipantes.hidden = true;
        idGrupoSeleccionado = null;
        administradorGrupoSeleccionado = false;
        mostrarMensajeParticipantes('');
        btnAbrirAgregar.hidden = true;
    }

    btnCerrarParticipantes.addEventListener('click', cerrarModalParticipantes);
    btnVolverParticipantes.addEventListener('click', cerrarModalParticipantes);

    modalParticipantes.addEventListener('click', (evento) => {
        if (evento.target === modalParticipantes) {
            cerrarModalParticipantes();
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modalParticipantes.hidden) {
            cerrarModalParticipantes();
        }
    });

    async function cargarParticipantes() {
        const idGrupo = idGrupoSeleccionado;

        listaParticipantes.replaceChildren();

        const cargando = document.createElement('p');
        cargando.textContent = 'Cargando participantes...';
        listaParticipantes.appendChild(cargando);

        try {
            const respuesta = await fetch(
                `/grupos/${idGrupo}/participantes/usuario/${idUsuario}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || 'No se pudieron consultar los participantes.'
                );
            }

            // Evitar mostrar datos de un grupo que ya se cerró o cambió
            if (modalParticipantes.hidden || idGrupoSeleccionado !== idGrupo) {
                return;
            }

            listaParticipantes.replaceChildren();

            const participantes = Array.isArray(datos.data)
                ? datos.data
                : [];

            if (participantes.length === 0) {
                const aviso = document.createElement('p');
                aviso.textContent = 'Este grupo no tiene participantes.';
                listaParticipantes.appendChild(aviso);
                return;
            }

            participantes.forEach(participante => {
                const fila = document.createElement('div');
                fila.className = 'grupos-participante';

                const informacion = document.createElement('div');
                informacion.className = 'grupos-participante-info';

                const nombre = document.createElement('strong');
                nombre.textContent = participante.nombre;

                const usuario = document.createElement('small');
                usuario.textContent = `@${participante.nombre_de_usuario}`;

                informacion.append(nombre, usuario);
                fila.appendChild(informacion);

                if (participante.administrador) {
                    const etiqueta = document.createElement('span');
                    etiqueta.className = 'grupos-etiqueta-admin';
                    etiqueta.textContent = 'Administrador';
                    fila.appendChild(etiqueta);

                } else if (administradorGrupoSeleccionado) {
                    const btnEliminar = document.createElement('button');
                    btnEliminar.type = 'button';
                    btnEliminar.className = 'grupos-btn-eliminar';
                    btnEliminar.textContent = 'Eliminar';

                    btnEliminar.addEventListener('click', () => {
                        eliminarParticipante(
                            idGrupo,
                            participante.id,
                            participante.nombre,
                            btnEliminar
                        );
                    });

                    fila.appendChild(btnEliminar);
                }

                listaParticipantes.appendChild(fila);
            });

        } catch (error) {
            console.error('Error al consultar participantes:', error);

            if (modalParticipantes.hidden || idGrupoSeleccionado !== idGrupo) {
                return;
            }

            listaParticipantes.replaceChildren();
            mostrarMensajeParticipantes(error.message, 'error');
        }
    }

    async function eliminarParticipante(
        idGrupo,
        idParticipante,
        nombreParticipante,
        boton
    ) {
        const confirmar = confirm(
            `¿Estás segura de eliminar a ${nombreParticipante} del grupo?`
        );

        if (!confirmar) {
            return;
        }

        boton.disabled = true;
        boton.textContent = 'Eliminando...';
        mostrarMensajeParticipantes('');

        try {
            const respuesta = await fetch(
                `/grupos/${idGrupo}/participantes/${idParticipante}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idAdministrador: idUsuario
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || 'No se pudo eliminar al participante.'
                );
            }

            if (idGrupoSeleccionado === idGrupo && !modalParticipantes.hidden) {
                await cargarParticipantes();
                mostrarMensajeParticipantes(
                    'Participante eliminado correctamente.',
                    'exito'
                );
            }

        } catch (error) {
            console.error('Error al eliminar participante:', error);

            if (idGrupoSeleccionado === idGrupo && !modalParticipantes.hidden) {
                mostrarMensajeParticipantes(error.message, 'error');
                boton.disabled = false;
                boton.textContent = 'Eliminar';
            }
        }
    }
    
    /* ==========================================
       AGREGAR PARTICIPANTES A UN GRUPO
       ========================================== */

    function mostrarMensajeAgregar(texto, tipo = '') {
        mensajeAgregar.textContent = texto;
        mensajeAgregar.className = tipo;
    }

    async function abrirModalAgregar() {
        if (!administradorGrupoSeleccionado || !idGrupoSeleccionado) {
            return;
        }

        const idGrupo = idGrupoSeleccionado;

        formAgregar.reset();
        mostrarMensajeAgregar('');

        nombreGrupoAgregar.textContent =
            `Grupo: ${nombreGrupoSeleccionado}`;

        // Ocultar temporalmente el modal de participantes
        modalParticipantes.hidden = true;
        modalAgregar.hidden = false;

        await cargarContactosDisponibles(idGrupo);
    }

    function cerrarModalAgregar() {
        modalAgregar.hidden = true;
        formAgregar.reset();
        mostrarMensajeAgregar('');

        // Regresar al modal de participantes
        if (idGrupoSeleccionado !== null) {
            modalParticipantes.hidden = false;
        }
    }

    btnAbrirAgregar.addEventListener('click', abrirModalAgregar);
    btnCerrarAgregar.addEventListener('click', cerrarModalAgregar);
    btnCancelarAgregar.addEventListener('click', cerrarModalAgregar);

    modalAgregar.addEventListener('click', (evento) => {
        if (evento.target === modalAgregar) {
            cerrarModalAgregar();
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modalAgregar.hidden) {
            cerrarModalAgregar();
        }
    });

    /* ==========================================
       CONSULTAR CONTACTOS DISPONIBLES
       ========================================== */

    async function cargarContactosDisponibles(idGrupo) {
        listaContactosAgregar.replaceChildren();
        btnGuardarParticipantes.disabled = true;

        const cargando = document.createElement('p');
        cargando.textContent = 'Cargando contactos disponibles...';
        listaContactosAgregar.appendChild(cargando);

        try {
            // Consultar contactos del proyecto y miembros del grupo
            const [respuestaContactos, respuestaParticipantes] =
                await Promise.all([
                    fetch(
                        `/proyectos/contactos-proyecto/${idProyecto}/${idUsuario}`
                    ),
                    fetch(
                        `/grupos/${idGrupo}/participantes/usuario/${idUsuario}`
                    )
                ]);

            const datosContactos = await respuestaContactos.json();
            const datosParticipantes = await respuestaParticipantes.json();

            if (!respuestaContactos.ok || !datosContactos.ok) {
                throw new Error('No se pudieron obtener los contactos.');
            }

            if (!respuestaParticipantes.ok || !datosParticipantes.ok) {
                throw new Error('No se pudieron consultar los integrantes.');
            }

            // Evitar actualizar un modal que ya se cerró
            if (modalAgregar.hidden || idGrupoSeleccionado !== idGrupo) {
                return;
            }

            const contactos = Array.isArray(datosContactos.contactos)
                ? datosContactos.contactos
                : [];

            const integrantes = Array.isArray(datosParticipantes.data)
                ? datosParticipantes.data
                : [];

            const idsIntegrantes = new Set(
                integrantes.map(integrante => Number(integrante.id))
            );

            // Mostrar solo contactos que aún no pertenecen al grupo
            const disponibles = contactos.filter(contacto =>
                !idsIntegrantes.has(Number(contacto.id)) &&
                Number(contacto.id) !== idUsuario
            );

            listaContactosAgregar.replaceChildren();

            if (disponibles.length === 0) {
                const aviso = document.createElement('p');
                aviso.textContent =
                    'No hay contactos disponibles para agregar a este grupo.';
                listaContactosAgregar.appendChild(aviso);
                return;
            }

            disponibles.forEach(contacto => {
                const etiqueta = document.createElement('label');
                etiqueta.className = 'grupos-contacto';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'nuevosParticipantes';
                checkbox.value = contacto.id;

                const informacion = document.createElement('span');
                informacion.className = 'grupos-contacto-info';

                const nombre = document.createElement('strong');
                nombre.textContent = contacto.nombre;

                const rol = document.createElement('small');
                rol.textContent = contacto.rol || 'Miembro';

                informacion.append(nombre, rol);
                etiqueta.append(checkbox, informacion);
                listaContactosAgregar.appendChild(etiqueta);
            });

            btnGuardarParticipantes.disabled = false;

        } catch (error) {
            console.error('Error al cargar contactos disponibles:', error);

            if (modalAgregar.hidden || idGrupoSeleccionado !== idGrupo) {
                return;
            }

            listaContactosAgregar.replaceChildren();
            mostrarMensajeAgregar(error.message, 'error');
        }
    }

    /* ==========================================
       GUARDAR NUEVOS PARTICIPANTES
       ========================================== */

    formAgregar.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (!administradorGrupoSeleccionado || !idGrupoSeleccionado) {
            mostrarMensajeAgregar('No tienes permisos para agregar participantes.', 'error');
            return;
        }

        const idGrupo = idGrupoSeleccionado;

        const participantes = Array.from(
            formAgregar.querySelectorAll(
                'input[name="nuevosParticipantes"]:checked'
            )
        ).map(checkbox => Number(checkbox.value));

        if (participantes.length === 0) {
            mostrarMensajeAgregar(
                'Selecciona al menos un participante.',
                'error'
            );
            return;
        }

        btnGuardarParticipantes.disabled = true;
        btnGuardarParticipantes.textContent = 'Agregando...';
        mostrarMensajeAgregar('');

        try {
            const respuesta = await fetch(
                `/grupos/${idGrupo}/participantes`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idAdministrador: idUsuario,
                        participantes
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || 'No se pudieron agregar los participantes.'
                );
            }

            if (idGrupoSeleccionado !== idGrupo || modalAgregar.hidden) {
                return;
            }

            // Volver al modal de integrantes
            cerrarModalAgregar();

            // Actualizar la lista para mostrar los nuevos miembros
            await cargarParticipantes();

            mostrarMensajeParticipantes(
                'Participantes agregados correctamente.',
                'exito'
            );

        } catch (error) {
            console.error('Error al agregar participantes:', error);

            if (idGrupoSeleccionado === idGrupo && !modalAgregar.hidden) {
                mostrarMensajeAgregar(error.message, 'error');
            }

        } finally {
            btnGuardarParticipantes.textContent = 'Agregar seleccionados';

            if (!modalAgregar.hidden) {
                btnGuardarParticipantes.disabled = false;
            }
        }
    });



    // Cargar grupos al abrir la página
    cargarGrupos();

};

/* ==========================================
   INICIALIZACIÓN DEL MÓDULO DE GRUPOS
   ========================================== */

let gruposInicializados = false;

function intentarInicializarGrupos() {

    if (gruposInicializados) return;

    const modal = document.getElementById('modalCrearGrupo');
    const formulario = document.getElementById('formCrearGrupo');
    const lista = document.getElementById('listaGrupos');

    // Esperar hasta que los elementos estén disponibles
    if (!modal || !formulario || !lista) return;

    gruposInicializados = true;
    inicializarGrupos();
}

// Para la página de pruebas
if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        intentarInicializarGrupos
    );
} else {
    intentarInicializarGrupos();
}

// Para los paneles que cargan los modales dinámicamente
document.addEventListener(
    'modalesGruposCargados',
    intentarInicializarGrupos
);

