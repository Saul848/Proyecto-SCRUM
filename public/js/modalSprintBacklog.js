const usuarioActualKanban = JSON.parse(sessionStorage.getItem("usuarioActivo"));
const proyectoActualKanban = JSON.parse(sessionStorage.getItem("proyectoActivo"));

const ROL_ACTUAL = proyectoActualKanban ? proyectoActualKanban.rol : "invitado"; 

// Se asegura de inyectar el html en el DOM
async function asegurarModalSprintCargado() {
    if (document.getElementById("sprint-backlog")) return;

    try {
        const respuesta = await fetch('../html/modalSprintBacklog.html');
        if (!respuesta.ok) {
            console.error("No se pudo cargar el archivo HTML del Sprint Backlog.");
            return;
        }
        const html = await respuesta.text();

        const zonaTrabajo = document.getElementById("zonaDeTrabajo");
        if (zonaTrabajo) {
            zonaTrabajo.insertAdjacentHTML('beforeend', html);
        } else {
            document.body.insertAdjacentHTML('beforeend', html);
        }

        // Inicializar selectores y eventos una vez cargado el HTML
        await inicializarSelectorIteraciones();
    } catch (error) {
        console.error("Error de red al intentar cargar el modal de Sprint:", error);
    }
}

// Roles que NO deben ver el botón de cambiar duración, impedimentos ni historial
const rolesConPermisos = ["facilitador"];

function aplicarPermisosInterfaz() {
    const elementosOcultables = document.querySelectorAll(".ocultable-rol");

    if (rolesConPermisos.includes(ROL_ACTUAL)) {
        elementosOcultables.forEach(elemento => {
            elemento.style.display = ""; 
        });
    } else {
        elementosOcultables.forEach(elemento => {
            elemento.style.display = "none"; 
        });
    }
}

/**
 * Obtiene la lista de sprints de la base de datos para llenar el <select>
 */
async function obtenerSprintsProyecto(idProyecto) {
    try {
        console.log('en CLIENYE INICIO: ' + idProyecto);
        const respuesta = await fetch(`/proyectos/listarSprints/${idProyecto}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (!respuesta.ok) return [];
        const datos = await respuesta.json();
        return datos.data;

    } catch (error) {
        console.error("Error al obtener los sprints:", error);
        return [];
    }
}

/**
 * Inicializa el selector de iteraciones y carga por defecto el sprint 1 (o el primero disponible)
 */
async function inicializarSelectorIteraciones() {
    const selectSprint = document.getElementById("select-no-iteracion");
    if (!selectSprint) return;

    const respuestaSprints = await obtenerSprintsProyecto(proyectoActualKanban.id);
    
    // Como tu controlador devuelve un objeto con la propiedad "data", extraemos el arreglo:
    const listaSprints = respuestaSprints || [];

    selectSprint.innerHTML = "";

    if (!listaSprints || listaSprints.length === 0) {
        const opcionVacia = document.createElement("option");
        opcionVacia.value = "";
        opcionVacia.textContent = "No hay sprints";
        selectSprint.appendChild(opcionVacia);
        limpiarDatosSprint();
        return;
    }

    // Llenar el select con los sprints existentes
    listaSprints.forEach((sprint) => {
        const option = document.createElement("option");
        
        // Usamos el no_iteracion del sprint como value para hacer las peticiones al Kanban
        option.value = sprint.no_iteracion; 
        
        // Mostramos el número de iteración amigable
        option.textContent = `Iteración ${sprint.no_iteracion}`;
        
        // Guardamos los datos en el dataset usando las propiedades exactas de tu JSON
        option.dataset.objetivo = sprint.objetivo ?? "";
        option.dataset.fechaInicio = sprint.fecha_inicio ?? "";
        option.dataset.fechaFin = sprint.fecha_fin ?? "";

        selectSprint.appendChild(option);
    });

    // Evento change al cambiar de iteración en el select
    selectSprint.addEventListener("change", async (e) => {
        const sprintIdSeleccionado = e.target.value;
        const optionSeleccionada = selectSprint.options[selectSprint.selectedIndex];
        
        if (!sprintIdSeleccionado) {
            limpiarDatosSprint();
            return;
        }

        actualizarInfoSprintUI(optionSeleccionada);
        await cargarKanvan(Number(sprintIdSeleccionado));
    });

    // Cargar por defecto el primer sprint de la lista
    selectSprint.selectedIndex = 0;
    const primerSprintOption = selectSprint.options[0];
    actualizarInfoSprintUI(primerSprintOption);
    await cargarKanvan(Number(primerSprintOption.value));
}

/**
 * Rellena la interfaz con la información de objetivo y fechas del sprint seleccionado
 */
function actualizarInfoSprintUI(optionElement) {
    const boxObjetivo = document.getElementById("objt-iteracion-box");
    const lblFechaInicio = document.getElementById("lbl-fecha-inicio");
    const lblFechaFinal = document.getElementById("lbl-fecha-final");

    const objetivo = optionElement.dataset.objetivo;
    const fechaInicioCruda = optionElement.dataset.fechaInicio;
    const fechaFinCruda = optionElement.dataset.fechaFin; // Mapeado correcto de fecha_fin

    // Asignar objetivo con validación si está vacío
    boxObjetivo.textContent = objetivo && objetivo.trim() !== "" 
        ? objetivo 
        : "No hay información para el objetivo de esta iteración.";

    // Aplicar formato de fecha
    lblFechaInicio.textContent = `Fecha inicio: ${formatearFechaSimple(fechaInicioCruda)}`;
    lblFechaFinal.textContent = `Fecha final: ${formatearFechaSimple(fechaFinCruda)}`;
}

/**
 * Limpia los campos si no hay información o sprints
 */
function limpiarDatosSprint() {
    document.getElementById("objt-iteracion-box").textContent = "No hay información disponible.";
    document.getElementById("lbl-fecha-inicio").textContent = "Fecha inicio: No disponible";
    document.getElementById("lbl-fecha-final").textContent = "Fecha final: No disponible";
    historiasDelSprint = [];
    inicializarTablero();
    actualizarBarraProgreso();
}

//Formatea la fecha para la interfaz
function formatearFechaSimple(fechaStr) {
    if (!fechaStr) return "No asignada";
    
    // Si viene con formato ISO completo "2026-11-08T00:00:00.000Z" nos quedamos solo con la parte de la fecha
    const soloFecha = fechaStr.split('T')[0]; 
    const partes = soloFecha.split('-'); // ["2026", "11", "08"]
    
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`; // Formato DD/MM/YYYY
    }
    
    return fechaStr;
}

///////////////////////////
// TABLERO KANVAN

async function obtenerHistoriasKanvan(idProyecto, idSprint) {
    try {
        const respuesta = await fetch(`/historias/historiasSprint/${idProyecto}/${idSprint}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!respuesta.ok) {
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

async function obtenerHistoriasKanvanDesarrollador(idProyecto, idSprint, idDesarrollador) {
    try {
        const respuesta = await fetch(`/historias/historiasSprintDev/${idProyecto}/${idSprint}/${idDesarrollador}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!respuesta.ok) {
            return [];
        }

        const datos = await respuesta.json();
        return datos.data || [];
    } catch (error) {
        console.error("Error de red al conectar con el servidor:", error);
        return [];
    }
}

let historiasDelSprint = [];

async function cargarKanvan(sprintActual = 1){
    if (ROL_ACTUAL === "facilitador" || ROL_ACTUAL === "cliente") {
        historiasDelSprint = await obtenerHistoriasKanvan(Number(proyectoActualKanban.id), sprintActual);
    } else if (ROL_ACTUAL === "desarrollador") {
        historiasDelSprint = await obtenerHistoriasKanvanDesarrollador(proyectoActualKanban.id, sprintActual, usuarioActualKanban.id);
    } else {
        historiasDelSprint = [];
    }

    if(historiasDelSprint.length === 0){
        console.warn("El Sprint está vacío o no hay historias.");
    }

    inicializarTablero();
    inicializarBuscadorKanban();
    actualizarBarraProgreso(); // Actualiza el porcentaje según historias terminadas
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
        const estado = historia.estado_actual ?? historia.estado;
        const columnaDestino = document.querySelector(`.columna-kanban[data-estado="${estado}"]`);

        if (columnaDestino) {
            if (historia.prioridad) {
                const primeraTarjeta = columnaDestino.querySelector(".tarjeta-historia");
                if (primeraTarjeta) {
                    columnaDestino.insertBefore(tarjeta, primeraTarjeta);
                } else {
                    columnaDestino.appendChild(tarjeta);
                }
            } else {
                columnaDestino.appendChild(tarjeta);
            }
        }
    });
}

function crearTarjeta(historia) {
    const card = document.createElement("div");
    const historiaId = historia.historia_id ?? historia.id;
    const titulo = historia.titulo ?? historia.descripcion ?? "Historia sin título";

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
            <button class="btn-detalles" onclick="verDetallesHistoriaKanban(${historiaId})">
                Ver detalles &rarr;
            </button>
        </div>
    `;

    card.addEventListener("dragstart", (e) => {
        document.getElementById("responsableHistoria").value = historia.nombre_responsable || "No asignado";
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

    // Validaciones de roles al mover...
    if (ROL_ACTUAL === "facilitador") {
        const esOrigenValido = estadoAnterior === "en-revision";
        const esDestinoValido = estadoDestino === "terminado" || estadoDestino === "en-progreso";
        if (!esOrigenValido || !esDestinoValido) {
            alert("Acción no permitida para el rol de facilitador en este estado.");
            return;
        }
    } else if (ROL_ACTUAL === "desarrollador") {
        const esOrigenValido = estadoAnterior === "por-empezar" || estadoAnterior === "en-progreso";
        const esDestinoValido = estadoDestino === "en-progreso" || estadoDestino === "en-revision";
        if (!esOrigenValido || !esDestinoValido) {
            alert("Acción no permitida para el rol de desarrollador en este estado.");
            return;
        }
    } else {
        alert("Acción denegada");
        return;
    }

    const historiaId = Number(tarjeta.dataset.id);
    const esPrioritaria = tarjeta.classList.contains("prioritaria");

    // Mover visualmente
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

    try {
        const guardado = await actualizarEstadoHistoria(historiaId, proyectoActualKanban.id, estadoDestino);
        if (!guardado) {
            columnaOrigen.appendChild(tarjeta);
            return;
        }

        const historiaEncontrada = historiasDelSprint.find(h => Number(h.historia_id ?? h.id) === historiaId);
        if (historiaEncontrada) {
            if ("estado_actual" in historiaEncontrada) {
                historiaEncontrada.estado_actual = estadoDestino;
            } else {
                historiaEncontrada.estado = estadoDestino;
            }
        }

        // Actualizar barra de progreso al cambiar el estado de una historia
        actualizarBarraProgreso();

    } catch (error) {
        console.error("No se pudo guardar el cambio:", error);
        columnaOrigen.appendChild(tarjeta);
        alert("Ocurrió un error al actualizar.");
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
            body: JSON.stringify({ nuevoEstado })
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok || resultado.success === false) {
            alert(resultado.mensaje || resultado.message || "Error al actualizar el estado.");
            return false;
        }

        alert("Estado actualizado correctamente. Actualice la pagina si no visualiza los cambios");
        return true;
    } catch (error) {
        console.error("Error al guardar modificaciones:", error);
        alert("Error de conexión al guardar los cambios.");
        return false;
    }
}

/**
 * Cuenta las historias terminadas del sprint actual y calcula el porcentaje para la barra de progreso
 */
function actualizarBarraProgreso() {
    const barraRelleno = document.getElementById("barra-progreso-relleno");
    const textoPorcentaje = document.getElementById("texto-porcentaje-progreso");

    if (!barraRelleno || !textoPorcentaje) return;

    const totalHistorias = historiasDelSprint.length;

    if (totalHistorias === 0) {
        barraRelleno.style.width = "0%";
        textoPorcentaje.textContent = "0%";
        return;
    }

    // Cuenta cuántas están en la columna "terminado"
    const historiasTerminadas = historiasDelSprint.filter(h => {
        const estado = h.estado_actual ?? h.estado;
        return estado === "terminado";
    }).length;

    const porcentaje = Math.round((historiasTerminadas / totalHistorias) * 100);

    barraRelleno.style.width = `${porcentaje}%`;
    textoPorcentaje.textContent = `${porcentaje}%`;
}

function inicializarBuscadorKanban() {
    const inputBusqueda = document.getElementById("inputBusquedaKanban");
    if (!inputBusqueda) return;

    inputBusqueda.addEventListener("input", (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();
        const tarjetas = document.querySelectorAll(".tarjeta-historia");

        tarjetas.forEach(tarjeta => {
            const tituloElemento = tarjeta.querySelector(".historia-titulo");
            const textoTitulo = tituloElemento ? tituloElemento.textContent.toLowerCase() : "";
            const contenidoCompleto = tarjeta.textContent.toLowerCase();

            if (textoTitulo.includes(textoBusqueda) || contenidoCompleto.includes(textoBusqueda)) {
                tarjeta.style.display = ""; 
            } else {
                tarjeta.style.display = "none"; 
            }
        });
    });
}