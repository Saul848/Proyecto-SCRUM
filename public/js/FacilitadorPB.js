const btnAgregarHistoria = document.getElementById("btnAgregarHistoria");
const btnModHistoria = document.getElementById("btnModHistoria");
const panelAgregarMod = document.getElementById("modalHistoria");
const divHistoria = document.getElementById("DivHistoria");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnGuardarHistoria = document.getElementById("btnGuardarModal");
// Elementos inputs del modal
const inpTitulo = document.getElementById("inpTitulo");
const inpDescripccion = document.getElementById("inpDescripccion");
const inpCriterios = document.getElementById("inpCriterios");
const inpValor = document.getElementById("inpValor");
const inpSprintAsig = document.getElementById("inpSprintAsig");

// Patrones para validacion de campos
let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000

// Elementos bandera
let enModificacion = null; // null = oculto, true/false = visible

// Variable global para almacenar las historias obtenidas del servidor
let datosHistorias = [];

/**
 * Función para renderizar dinámicamente las historias de usuario en el DOM
 */
async function renderizarHistorias() {
    // 1. Solicitamos los datos al servidor y los guardamos en la variable
    datosHistorias = await obtenerHistorias();

    // 2. Limpiamos el contenedor antes de inyectar los elementos
    divHistoria.innerHTML = "";

    // 3. Validamos si hay elementos para mostrar
    if (datosHistorias.length === 0) {
        divHistoria.innerHTML = `<p style="text-align: center; padding: 20px;">No hay historias de usuario registradas.</p>`;
        return;
    }

    // 4. Recorremos el arreglo y construimos dinámicamente cada fila con innerHTML
    datosHistorias.forEach((historia) => {
        const filaHtml = document.createElement("div");
        filaHtml.id = `DivFilaHistoria_${historia.id}`;
        filaHtml.className = "DivFilaHistoria";

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            <label class="LabelCriterios">${historia.criterios || historia.criterios_de_aceptacion || "#"}</label>
            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelSprintAsginado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
            
            <div class="DivBtnComentar">
                <button class="btnVerComentarios" data-id="${historia.id}">Ver comentarios</button>
            </div>
            <div class="DivBtnEliminar">
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}">🗑️</button>
            </div>
        `;

        divHistoria.appendChild(filaHtml);
    });
}

// Evento DOMContentLoaded para cargar los datos y renderizarlos al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
    await renderizarHistorias();
});

/**
 * Función para limpiar los campos del modal
 */
function limpiarCamposHistoria() {
    inpTitulo.value = "";
    inpDescripccion.value = "";
    inpCriterios.value = "";
    inpValor.value = "";
    inpSprintAsig.value = "";
}

// Listener para el botón "+ Añadir nueva historia"
btnAgregarHistoria.addEventListener("click", function () {
    setEnModificacion(false);
});

// Listener para el botón "# Modificar historia"
btnModHistoria.addEventListener("click", function () {
    setEnModificacion(true);
});

// Listener para cerrar el modal
btnCerrarModal.addEventListener('click', () => {
    setEnModificacion(null);
    limpiarCamposHistoria();
});

// Listener para guardar el modal
btnGuardarHistoria.addEventListener('click', () => {
    agregarHistoriaUsuario();
});

// Listener para la bandera "enModificacion" oyendo al evento personalizado
window.addEventListener('modificandoDatos', (evento) => {
    const estadoActual = evento.detail.activo;
    if (estadoActual === null) {
        panelAgregarMod.classList.remove('activo'); // Oculta el modal
    } else {
        panelAgregarMod.classList.add('activo');    // Muestra el modal
    }
});

/**
 * Función que cambia la bandera y dispara el evento personalizado
 */
function setEnModificacion(nuevoValor) {
    if (enModificacion !== nuevoValor) {
        enModificacion = nuevoValor;

        const evento = new CustomEvent('modificandoDatos', {
            detail: { activo: enModificacion }
        });
        window.dispatchEvent(evento);
    }
}

// Opcional: Cerrar el modal si se hace clic fuera de la caja blanca
window.addEventListener('click', (e) => {
    if (e.target === panelAgregarMod) {
        setEnModificacion(null);
        limpiarCamposHistoria();
    }
});

function verificarCamposAdd() {
    let verificado = true;
    let elementosDom = [inpTitulo, inpDescripccion, inpCriterios, inpValor, inpSprintAsig];

    elementosDom.forEach(elemento => {
        if (elemento.value.trim() === "") {
            elemento.style.border = "2px solid red";
            elemento.placeholder = "Error, rellena este campo";
            verificado = false;
        } else {
            if (elemento === inpTitulo) {
                if (!patronNombre.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "El nombre no debe llevar numeros o simbolos";
                    verificado = false;
                } else {
                    if (verificarTituloUnico(elemento)) {
                        elemento.style.border = "2px solid blue";
                    } else {
                        verificado = false;
                    }
                }
            }
            if (elemento === inpDescripccion) {
                if (!patronNombre.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese una descripccion adecuada";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if (elemento === inpCriterios) {
                if (!patronNombre.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese criterios adecuados";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if (elemento === inpValor) {
                if (!patronRangoValor.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
            if (elemento === inpSprintAsig) {
                if (!patronRangoValor.test(elemento.value.trim())) {
                    elemento.style.border = "2px solid red";
                    elemento.value = "";
                    elemento.placeholder = "Ingrese numeros válidos";
                    verificado = false;
                } else {
                    elemento.style.border = "2px solid blue";
                }
            }
        }
    });
    return verificado;
}

/**
 * Funcion para calcular el id
 */
function calcularId() {
    if (!datosHistorias || datosHistorias.length === 0) {
        return 1;
    } else {
        let valorMayor = datosHistorias[0].id;
        for (let n = 1; n < datosHistorias.length; n++) {
            let sigValor = datosHistorias[n].id;
            if (valorMayor < sigValor) {
                valorMayor = sigValor;
            }
        }
        return (valorMayor + 1);
    }
}

/**
 * Funcion que verifica si existe una historia con un titulo igual
 */
function verificarTituloUnico(inputDom) {
    if (!datosHistorias) {
        return true;
    } else {
        for (let n = 0; n < datosHistorias.length; n++) {
            if (datosHistorias[n].titulo === inputDom.value.trim() || datosHistorias[n].nombre === inputDom.value.trim()) {
                inputDom.style.border = "2px solid red";
                inputDom.value = "";
                inputDom.placeholder = "La historia ya existe en el sistema";
                return false;
            }
        }
        return true;
    }
}

/**
 * Obtiene un arreglo de historias desde el servidor
 */
async function obtenerHistorias() {
    const respuesta = await fetch(`/historias`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });
    if (!respuesta.ok) {
        alert("Ocurrió un error, datos no obtenidos");
        return [];
    }
    const datos = await respuesta.json();
    const historias = datos.data || [];
    return historias;
}


function agregarNuevaHistoria() {
    //Se da de alta una bandera, si llega al final del metodo y pasa las verificaciones el empleado es valido.
    let historiaValida = verificarCamposAdd();
    //Se verifican la informacion ingresada en los campos
    if (historiaValida) {
        agregarHistoriaUsuario()
    }
}



/**
 * Funcion que construye los datos de la historia y realiza la peticion POST
 */
async function agregarHistoriaUsuario() {
    // Primero verificamos que los campos cumplan las reglas
    if (!verificarCamposAdd()) {
        return;
    }

    let nombre = inpTitulo.value.trim();
    let descripcion = inpDescripccion.value.trim();
    let criterios = inpCriterios.value.trim();
    let valor = inpValor.value.trim();
    let sprint = inpSprintAsig.value.trim();

    const respuesta = await fetch("/historias", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion,
            criterios: criterios,
            valor: valor,
            sprint: sprint
        })
    });

    const resultado = await respuesta.json();

    if (resultado.ok || respuesta.status === 201) {
        alert(resultado.mensaje || "Historia agregada correctamente");

        // Actualizamos la lista de historias dinámicamente llamando a nuestra función
        await renderizarHistorias();

        // Se limpian los campos de la sección agregar
        limpiarCamposHistoria();
        // Se oculta el modal
        setEnModificacion(null);
    } else {
        alert(resultado.mensaje || resultado.error || "Error al agregar la historia");
    }
}

function cargar_cabecera_inicial() {
    document.getElementById("cabecera-mensajes").style.display = "block";
}
///////////////////////////
///////////////////////////
// TABLERO KANVAN

/**
 * Realiza una petición GET al servidor para obtener todas las historias de usuario 
 * del sprint actual correspondientes al proyecto (facilitador/cliente)
 * 
 * @async
 * @function obtenerHistoriasKanvan
 * @param {number} idProyecto - Identificador único del proyecto.
 * @param {number} idSprint - Identificador único del sprint actual.
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
 *                                   las historias del sprint, o un arreglo vacío si ocurre un error.
 */
async function obtenerHistoriasKanvan(idProyecto, idSprint) {
    try {
        const respuesta = await fetch(`/historias/historiasSprint/${idProyecto}/${idSprint}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!respuesta.ok) {
            alert("Ocurrió un error al obtener las historias del sprint.");
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

/**
 * Realiza una petición GET al servidor para obtener únicamente las historias 
 * asignadas a un desarrollador específico dentro del proyecto y sprint actual.
 * 
 * @async
 * @function obtenerHistoriasKanvanDesarrollador
 * @param {number} idProyecto - Identificador único del proyecto.
 * @param {number} idSprint - Identificador único del sprint actual.
 * @param {number} idDesarrollador - Identificador único del usuario (desarrollador).
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
 *                                   las historias asignadas al desarrollador, o un arreglo vacío si falla.
 */
async function obtenerHistoriasKanvanDesarrollador(idProyecto, idSprint, idDesarrollador) {
    try {
        const respuesta = await fetch(`/historias/historiasSprintDev/${idProyecto}/${idSprint}/${idDesarrollador}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!respuesta.ok) {
            alert("Ocurrió un error al obtener las historias del desarrollador.");
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

// Rol del usuario actual logueado (puedes cambiarlo a "desarrollador", "facilitador" o "cliente")
const ROL_ACTUAL = "facilitador";
let historiasDelSprint = [];

async function cargarKanvan(){
    if (ROL_ACTUAL === "facilitador"  || ROL_ACTUAL === "cliente") {
        // CAMBIAR A SPRINT Y PROYECTO ACTUALES
        historiasDelSprint = await obtenerHistoriasKanvan(1, 1);
        if(historiasDelSprint.length === 0){
            alert("El Sprint esta vacio");
        }
    } else if (ROL_ACTUAL === "desarrollador") {
        // CAMBIAR A SPRINT Y PROYECTO ACTUALES Y ID DESARROLLADOR
        historiasDelSprint = await obtenerHistoriasKanvanDesarrollador(1, 1, 1);
        if(historiasDelSprint.length === 0){
            alert("El Sprint esta vacio");
        }
    } else {
        alert("ROL no especificado o no valido")
    }

    inicializarTablero();
}

let tarjetaArrastrada = null;
let estadoOrigen = null;

function inicializarTablero() {
    const columnas = document.querySelectorAll(".columna-kanban");

    columnas.forEach(columna => {
        columna.innerHTML = "";

        columna.addEventListener("dragover", (e) => {
            e.preventDefault();
            columna.classList.add("drag-over");
        });

        columna.addEventListener("dragleave", () => {
            columna.classList.remove("drag-over");
        });

        columna.addEventListener("drop", manejarDrop);
    });

    historiasDelSprint.forEach(historia => {
        const tarjeta = crearTarjeta(historia);

        // Admite los nombres de propiedades que devuelve tu procedimiento
        const estado = historia.estado_actual ?? historia.estado;

        const columnaDestino = document.querySelector(
            `.columna-kanban[data-estado="${estado}"]`
        );

        if (columnaDestino) {
            // LÓGICA DE ORDENAMIENTO:
            // Si es prioritaria, va hasta arriba. Si no, se coloca al final (debajo de las prioritarias).
            if (historia.prioridad) {
                // Inserta la tarjeta antes de la primera tarjeta existente en la columna
                const primeraTarjeta = columnaDestino.querySelector(".tarjeta-historia");
                if (primeraTarjeta) {
                    columnaDestino.insertBefore(tarjeta, primeraTarjeta);
                } else {
                    columnaDestino.appendChild(tarjeta);
                }
            } else {
                // Las no prioritarias se van al final de la columna (debajo de las prioritarias)
                columnaDestino.appendChild(tarjeta);
            }
        }
    });
}

function crearTarjeta(historia) {
    const card = document.createElement("div");

    // El procedimiento almacenado devuelve historia_id
    const historiaId = historia.historia_id ?? historia.id;
    const titulo = historia.titulo ?? historia.descripcion ?? "Historia sin título";
    console.log(historia);

    // Asignación de clase según si es prioritaria (boolean)
    if (historia.prioridad) {
        card.classList.add("prioritaria");
    } else {
        card.classList.add("no-prioritaria");
    }
    
    card.classList.add("tarjeta-historia");
    card.setAttribute("draggable", "true");
    card.dataset.id = historiaId;

    card.innerHTML = `
        <h4 class="historia-titulo">${titulo}</h4>
        <div class="tarjeta-footer">
            <button class="btn-detalles"
                onclick="verDetallesHistoriaKanban(${historiaId})">
                Ver detalles &rarr;
            </button>
        </div>
    `;

    card.addEventListener("dragstart", (e) => {
         console.log(historiasDelSprint);

        document.getElementById("responsableHistoria").value = historia.nombre_responsable;
        tarjetaArrastrada = card;
        estadoOrigen = card.parentElement.dataset.estado;

        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", historiaId);
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        tarjetaArrastrada = null;
        estadoOrigen = null;
    });

    return card;
}

async function manejarDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    if (!tarjetaArrastrada) return;

    const tarjeta = tarjetaArrastrada;
    const estadoAnterior = estadoOrigen;
    const columnaOrigen = tarjeta.parentElement;
    const columnaDestino = this;

    const estadoDestino = columnaDestino.dataset.estado;

    if (estadoDestino === estadoAnterior) return;

    // Reglas para el facilitador
    if (ROL_ACTUAL === "facilitador") {
        const esOrigenValido = estadoAnterior === "en-revision";
        const esDestinoValido =
            estadoDestino === "terminado" ||
            estadoDestino === "en-progreso";

        if (!esOrigenValido || !esDestinoValido) {
            alert(
                "Solo puedes mover historias desde 'En revisión' " +
                "hacia 'Terminado' o regresar a 'En progreso'."
            );
            return;
        }
    }
    // Reglas para el desarrollador
    else if (ROL_ACTUAL === "desarrollador") {
        const esOrigenValido =
            estadoAnterior === "por-empezar" ||
            estadoAnterior === "en-progreso";

        const esDestinoValido =
            estadoDestino === "en-progreso" ||
            estadoDestino === "en-revision";

        if (!esOrigenValido || !esDestinoValido) {
            alert(
                "Solo puedes mover historias desde 'Por empezar' " +
                "o 'En progreso' hacia 'En progreso' o 'En revisión'."
            );
            return;
        }
    } else {
        alert("Acción denegada");
        return;
    }

    const historiaId = Number(tarjeta.dataset.id);

    // Movimiento visual provisional respetando la prioridad al soltar
    const esPrioritaria = tarjeta.classList.contains("prioritaria");
    if (esPrioritaria) {
        const primeraTarjeta = columnaDestino.querySelector(".tarjeta-historia");
        if (primeraTarjeta) {
            columnaDestino.insertBefore(tarjeta, primeraTarjeta);
        } else {
            columnaDestino.appendChild(tarjeta);
        }
    } else {
        columnaDestino.appendChild(tarjeta);
    }

    tarjeta.setAttribute("draggable", "false");

    try {
        const guardado = await actualizarEstadoHistoria(historiaId, 1, estadoDestino);

        if (!guardado) {
            // Revertir posición si falla la BD
            if (esPrioritaria) {
                const primeraTarjetaOrigen = columnaOrigen.querySelector(".tarjeta-historia");
                if (primeraTarjetaOrigen) {
                    columnaOrigen.insertBefore(tarjeta, primeraTarjetaOrigen);
                } else {
                    columnaOrigen.appendChild(tarjeta);
                }
            } else {
                columnaOrigen.appendChild(tarjeta);
            }
            return;
        }

        const historiaEncontrada = historiasDelSprint.find(
            historia =>
                Number(historia.historia_id ?? historia.id) === historiaId
        );

        if (historiaEncontrada) {
            if ("estado_actual" in historiaEncontrada) {
                historiaEncontrada.estado_actual = estadoDestino;
            } else {
                historiaEncontrada.estado = estadoDestino;
            }
        }

        console.log(
            `BD actualizada: historia ${historiaId}, estado ${estadoDestino}`
        );
    } catch (error) {
        console.error("No se pudo guardar el cambio:", error);
        if (esPrioritaria) {
            const primeraTarjetaOrigen = columnaOrigen.querySelector(".tarjeta-historia");
            if (primeraTarjetaOrigen) {
                columnaOrigen.insertBefore(tarjeta, primeraTarjetaOrigen);
            } else {
                columnaOrigen.appendChild(tarjeta);
            }
        } else {
            columnaOrigen.appendChild(tarjeta);
        }
        alert("Ocurrió un error. La tarjeta regresará a su columna original.");
    } finally {
        tarjeta.setAttribute("draggable", "true");
    }
}

async function actualizarEstadoHistoria(idHistoria, idProyecto, nuevoEstado) {
    try {
        const respuesta = await fetch(`/historias/estado/${idHistoria}/${idProyecto}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                nuevoEstado
            })
        });

        // Evita fallos si el servidor no devuelve JSON válido.
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.success === false) {
            alert(
                resultado.mensaje ||
                resultado.message ||
                "Error al actualizar el estado."
            );

            return false;
        }

        alert("Estado actualizado correctamente");
        return true;

    } catch (error) {
        console.error("Error al guardar modificaciones:", error);
        alert("Error de conexión al guardar los cambios.");
        return false;
    }
}

/**
 * Abre el modal de detalle de historia y carga su información dinámicamente.
 * @param {number} historiaId - ID de la historia de usuario seleccionada.
 */
async function verDetallesHistoriaKanban(historiaId) {
    // 1. Mostrar el modal usando lógica existente
    mostrarModal("modal-detalle-historia-kanban");

    // 2. Intentar buscar la historia en el arreglo local del sprint actual
    let historia = historiasDelSprint.find(
        h => Number(h.historia_id ?? h.id) === Number(historiaId)
    );


    if (!historia) {
        console.warn("No se encontró la historia en los datos locales.");
        return;
    }

    // 3. Rellenar los elementos del modal con los datos de la historia
    document.getElementById("kanban-detalle-badge-estado").textContent = historia.estado_actual ?? historia.estado ?? "Sin asignar";
    document.getElementById("kanban-detalle-no-historia").textContent = historia.historia_id ?? historia.id ?? "#";
    document.getElementById("kanban-detalle-no-sprint").textContent = historia.no_sprint ?? "#";
    document.getElementById("kanban-detalle-puntos").textContent = historia.puntos_de_esfuerzo ?? historia.puntos_de_historia ?? "#";
    document.getElementById("kanban-detalle-horas").textContent = historia.horas_estimadas ?? historia.coste_estimado ?? "#";
    document.getElementById("kanban-detalle-responsable").textContent = historia.nombre_responsable ?? "Sin asignar";

    // Rellenar comentarios (si el procedimiento devuelve un string separado por comas o un arreglo)
    const contenedorComentarios = document.getElementById("kanban-detalle-comentarios");
    contenedorComentarios.innerHTML = "";
    if (historia.comentarios && historia.comentarios !== "Sin comentarios") {
        // Si vienen separados por ' | ' como lo estructuramos en el procedimiento SQL:
        const listaComentarios = historia.comentarios.split(" | ");
        listaComentarios.forEach(com => {
            const spanCom = document.createElement("span");
            spanCom.className = "kanban-detalle-comentario-item";
            spanCom.textContent = com;
            contenedorComentarios.appendChild(spanCom);
        });
    } else {
        contenedorComentarios.innerHTML = '<span class="kanban-detalle-comentario-item">Sin comentarios</span>';
    }

    // Rellenar descripción y criterios de aceptación
    document.getElementById("kanban-detalle-descripcion").textContent = historia.descripcion ?? "Sin descripción";
    document.getElementById("kanban-detalle-criterios").textContent = historia.criterios_de_aceptacion ?? "Sin criterios definidos";

    // Guardar o enlazar el enlace de evidencias si lo requieres para el botón
    window.evidenciasRutaServidor = historia.evidencias_servidor ?? "";
}

/**
 * Acción del botón para abrir las evidencias del servidor
 */
function verEvidenciasServidor() {
    if (window.evidenciasRutaServidor && window.evidenciasRutaServidor !== "Sin evidencias") {
        alert("Ruta de evidencias en el servidor: " + window.evidenciasRutaServidor);
        // O puedes abrirla / manejarla según tu lógica local
    } else {
        alert("No hay evidencias registradas para esta historia.");
    }
}

// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", cargarKanvan);

// TERMINO TABLERO KANVAN
////////////////////////////////
////////////////////////////////


cargar_cabecera_inicial();