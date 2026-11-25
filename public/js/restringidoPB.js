const selectPrincipalEpicas = document.getElementById("selectEpicas");
const divHistoria = document.getElementById("DivHistoria");

// Captura de elementos de filtro del DOM
const inputFiltroId = document.getElementById("inputFiltroId");
const inputFiltroNombre = document.getElementById("inputFiltroNombre");
const inputFiltroValor = document.getElementById("inputFiltroValor");
const inputFiltroSprint = document.getElementById("inputFiltroSprint");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

// Variables globales de consulta
let todasLasHistorias = [];
let listaEpicasProyecto = [];
let datosSprints = [];

const proyectoActivoSesion = JSON.parse(sessionStorage.getItem("proyectoActivo") || "null");
const idProyectoActivo = proyectoActivoSesion ? proyectoActivoSesion.id : null;

// Carga inicial al renderizar el DOM
document.addEventListener("DOMContentLoaded", async () => {
    if (!idProyectoActivo) {
        console.log("No hay ningún proyecto activo en la sesión.");
        return;
    }

    if (divHistoria) {
        await inicializarBacklog();
        await cargarEpicasEnProyecto(idProyectoActivo);
    }

    if (document.getElementById("DivSprint")) {
        await renderizarSprints();
    }
});

/**
 * Obtiene un arreglo de historias desde el servidor.
 * @param {number|string} idProyecto - Identificador del proyecto activo.
 * @returns {Promise<Array<Object>>} Arreglo de historias de usuario.
 */
async function obtenerHistorias(idProyecto) {
    try {
        const respuesta = await fetch(`/historias/historiasPB/${idProyecto}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert(datos.mensaje || "Error al obtener las historias.");
            return [];
        }
        return datos.data || [];
    } catch (error) {
        console.error("Error al obtener historias:", error);
        return [];
    }
}

/**
 * Inicializa el Product Backlog obteniendo la lista completa de historias desde el servidor,
 * almacenándolas en la variable maestra global e invocando el sistema de filtrado inicial.
 * @async
 * @function inicializarBacklog
 * @returns {Promise<void>}
 */
async function inicializarBacklog() {
    todasLasHistorias = await obtenerHistorias(idProyectoActivo);
    aplicarFiltros();
}

/**
 * Filtra el arreglo maestro de historias en tiempo real basándose en los valores actuales
 * ingresados en los campos de búsqueda (ID, nombre, valor, sprint asignado y épica).
 * Posteriormente, delega el resultado a la función de renderizado.
 * @function aplicarFiltros
 * @returns {void}
 */
function aplicarFiltros() {
    const filtroId = inputFiltroId ? inputFiltroId.value.trim().toLowerCase() : "";
    const filtroNombre = inputFiltroNombre ? inputFiltroNombre.value.trim().toLowerCase() : "";
    const filtroValor = inputFiltroValor ? inputFiltroValor.value.trim().toLowerCase() : "";
    const filtroSprint = inputFiltroSprint ? inputFiltroSprint.value.trim().toLowerCase() : "";
    const filtroEpica = selectPrincipalEpicas ? selectPrincipalEpicas.value : "";
    const nombreEpicaSeleccionada = (selectPrincipalEpicas && filtroEpica !== "")
        ? (selectPrincipalEpicas.options[selectPrincipalEpicas.selectedIndex]?.text || "").toLowerCase()
        : "";

    const historiasFiltradas = todasLasHistorias.filter((historia) => {
        const idStr = String(historia.id ?? "").toLowerCase();
        const numHistoriaStr = String(historia.numeroDeHistoria ?? "").toLowerCase();
        const nombreStr = String(historia.nombre || historia.titulo || "").toLowerCase();
        const valorStr = String(historia.valor ?? "").toLowerCase();

        const iteracionStr = String(historia.sprint_no_iteracion ?? historia.no_iteracion ?? "").toLowerCase();
        const sprintStr = String(historia.asignado_al_sprint || historia.sprintAsig || "").toLowerCase();
        const sprintVisibleStr = (iteracionStr !== "" ? iteracionStr : (sprintStr !== "" ? sprintStr : "#")).toLowerCase();
        const epicaHistoriaStr = String(historia.epica_asignada || "").toLowerCase();

        const matchId = filtroId === "" || idStr.includes(filtroId) || numHistoriaStr.includes(filtroId);
        const matchNombre = filtroNombre === "" || nombreStr.includes(filtroNombre);
        const matchValor = filtroValor === "" || valorStr.includes(filtroValor);
        const matchSprint = filtroSprint === "" || iteracionStr.includes(filtroSprint) || sprintStr.includes(filtroSprint) || sprintVisibleStr.includes(filtroSprint);
        const matchEpica = filtroEpica === "" || epicaHistoriaStr === nombreEpicaSeleccionada;

        return matchId && matchNombre && matchValor && matchSprint && matchEpica;
    });

    renderizarTablaFiltrada(historiasFiltradas);
}

/**
 * Obtiene el color de fondo correspondiente al estado de la historia.
 * @function obtenerColorEstadoHistoria
 * @param {string} estado
 * @returns {string}
 */
function obtenerColorEstadoHistoria(estado) {
    const estadoNormalizado = String(estado || "por empezar").trim().toLowerCase();
    if (estadoNormalizado === "en progreso") return "#fed7aa";
    if (estadoNormalizado === "en revision" || estadoNormalizado === "en revisión") return "#bfdbfe";
    if (estadoNormalizado === "terminado") return "#bbf7d0";
    return "#ffffff";
}

/**
 * Recorre un arreglo de historias de usuario y construye dinámicamente las filas HTML
 * correspondientes en modo solo lectura (sin selección, iluminación ni botón de eliminar).
 * @function renderizarTablaFiltrada
 * @param {Array<Object>} historias - Arreglo de objetos que representan las historias de usuario a mostrar.
 * @returns {void}
 */
function renderizarTablaFiltrada(historias) {
    if (!divHistoria) return;
    divHistoria.innerHTML = "";

    if (historias.length === 0) {
        divHistoria.innerHTML = `<p style="text-align: center; padding: 20px; color: #64748b;">No se encontraron historias que coincidan con los filtros.</p>`;
        return;
    }

    historias.forEach((historia) => {
        const filaHtml = document.createElement("div");
        filaHtml.id = `DivFilaHistoria_${historia.id}`;
        filaHtml.className = "DivFilaHistoria";

        const estadoActual = historia.estado || "por empezar";
        filaHtml.style.backgroundColor = obtenerColorEstadoHistoria(estadoActual);

        const criterios = historia.criterios && historia.criterios.length > 0
            ? historia.criterios
            : [{ criterio: "Sin criterios de aceptación" }];

        const totalCriterios = criterios.length;
        let criteriosTextAreasHTML = "";
        criterios.forEach((crit, index) => {
            const claseActiva = index === 0 ? "active" : "";
            const textoCrit = typeof crit === "string" ? crit : (crit?.criterio ?? "");
            criteriosTextAreasHTML += `<textarea class="criterio-input-fila ${claseActiva}" readonly placeholder="Criterio...">${textoCrit}</textarea>`;
        });

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.numeroDeHistoria || "#"}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || "#"}</label>
            
            <div class="criterio-fila-wrapper" data-index="0" data-total="${totalCriterios}">
                <button type="button" class="btn-fila-lateral btn-fila-izq" onclick="cambiarCriterioFila(${historia.id}, -1)" title="Anterior">◀</button>
                <div class="criterios-fila-columna" id="criteriosContainer_${historia.id}">
                    <span class="criterio-contador-fila" id="contadorCriterioFila_${historia.id}">1 / ${totalCriterios}</span>
                    ${criteriosTextAreasHTML}
                </div>
                <button type="button" class="btn-fila-lateral btn-fila-der" onclick="cambiarCriterioFila(${historia.id}, 1)" title="Siguiente">▶</button>
            </div>

            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelHorasEstimadas">${historia.horas || "#"}</label>
            <label class="LabelPuntosHistoria">${historia.puntos_de_historia ?? 0}</label>
            <label class="LabelEpicaAsignada">${historia.epica_asignada || "#"}</label>
            <label class="LabelEstadoHistoria">${estadoActual}</label>
            <label class="LabelSprintAsignado">${historia.sprint_no_iteracion || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
        `;

        divHistoria.appendChild(filaHtml);
    });
}

/**
 * Alterna el criterio de aceptación visible dentro de una fila del Product Backlog.
 * @function cambiarCriterioFila
 * @param {number|string} idHistoria - Identificador de la historia de usuario.
 * @param {number} delta - Desplazamiento (-1 para anterior, 1 para siguiente).
 * @returns {void}
 */
function cambiarCriterioFila(idHistoria, delta) {
    const fila = document.getElementById(`DivFilaHistoria_${idHistoria}`);
    if (!fila) return;

    const wrapper = fila.querySelector(".criterio-fila-wrapper");
    const contenedor = document.getElementById(`criteriosContainer_${idHistoria}`);
    if (!wrapper || !contenedor) return;

    const textareas = Array.from(contenedor.querySelectorAll("textarea.criterio-input-fila"));
    if (textareas.length === 0) return;

    let indiceActual = Number(wrapper.getAttribute("data-index") || 0);
    if (textareas.length > 1) {
        indiceActual = (indiceActual + delta + textareas.length) % textareas.length;
    } else {
        indiceActual = 0;
    }

    wrapper.setAttribute("data-index", String(indiceActual));
    textareas.forEach((ta, idx) => {
        ta.classList.toggle("active", idx === indiceActual);
    });

    const contador = document.getElementById(`contadorCriterioFila_${idHistoria}`);
    if (contador) {
        contador.textContent = `${indiceActual + 1} / ${textareas.length}`;
    }
}

/**
 * Obtiene todas las épicas de un proyecto e inserta los valores en el select principal de filtro.
 * @param {number|string} idProyecto - Identificador del proyecto.
 * @returns {Promise<Array<Object>>} Variable global listaEpicasProyecto.
 */
async function cargarEpicasEnProyecto(idProyecto) {
    try {
        const respuesta = await fetch(`/epicas/${idProyecto}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        const datos = await respuesta.json();
        listaEpicasProyecto = Array.isArray(datos.data) ? datos.data : (Array.isArray(datos) ? datos : []);
        poblarSelectEpicas(selectPrincipalEpicas, listaEpicasProyecto, "Todas las épicas");
        return listaEpicasProyecto;
    } catch (error) {
        console.error("Error al cargar las épicas del proyecto:", error);
        return [];
    }
}

/**
 * Rellena el elemento select con las épicas disponibles del proyecto.
 * @param {HTMLSelectElement} selectEl - Elemento select del DOM.
 * @param {Array<Object>} epicas - Arreglo de épicas del proyecto.
 * @param {string} textoPorDefecto - Texto de la opción inicial.
 * @returns {void}
 */
function poblarSelectEpicas(selectEl, epicas, textoPorDefecto) {
    if (!selectEl) return;
    const valorPrevio = selectEl.value;
    selectEl.innerHTML = `<option value="">${textoPorDefecto}</option>`;
    epicas.forEach((epica) => {
        const option = document.createElement("option");
        option.value = epica.id;
        option.textContent = epica.nombre;
        selectEl.appendChild(option);
    });
    if (valorPrevio && Array.from(selectEl.options).some(opt => opt.value === valorPrevio)) {
        selectEl.value = valorPrevio;
    }
}

/**
 * Regresa desde la vista de Sprints hacia la vista del Product Backlog.
 * @returns {void}
 */
function regresarAProductBacklog() {
    const modalSprints = document.getElementById("modal-gestion-sprints");
    if (modalSprints) {
        modalSprints.style.display = "none";
        modalSprints.classList.remove("activo");
    }

    if (typeof mostrarModal === "function") {
        mostrarModal("modal-product-backlog", "cabecera-productBacklog");
    } else {
        const modalPB = document.getElementById("modal-product-backlog");
        if (modalPB) modalPB.style.display = "block";
    }
}

// Listeners de filtros del Product Backlog
if (selectPrincipalEpicas) {
    selectPrincipalEpicas.addEventListener("change", aplicarFiltros);
}

[inputFiltroId, inputFiltroNombre, inputFiltroValor, inputFiltroSprint].forEach(input => {
    if (input) {
        input.addEventListener("input", aplicarFiltros);
    }
});

if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener("click", () => {
        if (inputFiltroId) inputFiltroId.value = "";
        if (inputFiltroNombre) inputFiltroNombre.value = "";
        if (inputFiltroValor) inputFiltroValor.value = "";
        if (inputFiltroSprint) inputFiltroSprint.value = "";
        if (selectPrincipalEpicas) selectPrincipalEpicas.value = "";
        aplicarFiltros();
    });
}