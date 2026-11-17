// ==========================================================
// GESTIÓN DE SPRINTS - CRUD COMPLETO Y LÓGICA DE PANELES
// ==========================================================

let datosSprints = [];
let idSprintSeleccionado = null;
let sprintSeleccionadoFilaDOM = null;

// Patrón para validar objetivos (letras de la a a la z, ñ y acentos)
let patronObjetivoSprint= /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\x20]+$/;

// Ejecución inicial al cargar el DOM del panel de gestión
document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("DivSprint")) {
        await renderizarSprints();
    }
});

/**
 * Método renderizarSprints: Obtiene la lista de sprints de la BD,
 * los ordena por número de sprint y construye las filas con su respectiva sección desplegable.
 */
async function renderizarSprints() {
    const contenedorSprints = document.getElementById("DivSprint");
    if (!contenedorSprints) return;

    try {
        const respuesta = await fetch(`/sprints/listar/${idProyectoActivo}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            contenedorSprints.innerHTML = `<p style="text-align: center; color: red;">Error al cargar los sprints.</p>`;
            return;
        }

        datosSprints = resultado.data || resultado.datos || [];
        
        // Ordenar estrictamente por número de Sprint (NoSprint / no_iteracion)
        datosSprints.sort((a, b) => Number(a.NoSprint || a.no_iteracion || 0) - Number(b.NoSprint || b.no_iteracion || 0));

        contenedorSprints.innerHTML = "";

        if (datosSprints.length === 0) {
            contenedorSprints.innerHTML = `<p style="text-align: center; padding: 20px; color: #64748b;">No hay sprints registrados en este proyecto.</p>`;
            return;
        }

        datosSprints.forEach(sprint => {
            // Leer correctamente las propiedades con mayúsculas que devuelve el DAO
            const sprintId = sprint.Id || sprint.id || sprint.id_sprint;
            const noSprint = sprint.NoSprint || sprint.no_iteracion;
            const objetivo = sprint.objetivo || sprint.objetivo_sprint;
            const estado = sprint.estado || "planeado";
            const fechaInicio = sprint.fechaInicio || sprint.fecha_inicio;
            const fechaFin = sprint.fechaFin || sprint.fecha_fin;
            const historiasAsignadas = sprint.historiasAsignadas || sprint.historias || [];

            // Contenedor principal de la fila del sprint
            const filaSprint = document.createElement("div");
            filaSprint.className = "DivFilaSprint";
            filaSprint.id = `DivFilaSprint_${sprintId}`; // ID único por cada sprint real

            // Listener para seleccionar la fila de Sprint
            filaSprint.addEventListener("click", (e) => {
                if (e.target.closest('.btn-toggle-sprint') || e.target.closest('.btn-accion-sprint')) return;
                seleccionarFilaSprint(sprintId, filaSprint);
            });

            filaSprint.innerHTML = `
                <label>${noSprint}</label>
                <label>${objetivo}</label>
                <label>${estado}</label>
                <label>${fechaInicio}</label>
                <label>${fechaFin}</label>
                <div class="div-acciones-sprint" style="display: flex; gap: 6px; justify-content: center;">
                    <button type="button" class="btn-toggle-sprint" title="Ver historias asignadas" onclick="toggleDetalleSprint(${sprintId})" style="background:#0d8bf2; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">📖</button>
                    <button type="button" class="btn-accion-sprint" title="Eliminar Sprint" onclick="confirmarEliminarSprint(${sprintId})" style="background:#ff4444; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">🗑️</button>
                </div>
            `;
            contenedorSprints.appendChild(filaSprint);

            // Sección desplegable debajo de la fila con la tabla de historias asignadas
            const seccionDetalle = document.createElement("div");
            seccionDetalle.id = `detalleSprint_${sprintId}`;
            seccionDetalle.className = "seccion-detalle-sprint-desplegada";
            seccionDetalle.style.display = "none";
            seccionDetalle.style.gridColumn = "1 / -1";
            seccionDetalle.style.padding = "12px";
            seccionDetalle.style.backgroundColor = "#f1f5f9";
            seccionDetalle.style.borderRadius = "8px";
            seccionDetalle.style.marginTop = "4px";
            seccionDetalle.style.marginBottom = "8px";

            let htmlHistoriasAsignadas = `
                <h4 style="margin-bottom: 8px; color: #1e293b; font-size: 13px;">Historias de Usuario Asignadas al Sprint ${noSprint}</h4>
                <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden;">
                    <thead>
                        <tr style="background: #e2e8f0; font-size: 12px; text-align: left;">
                            <th style="padding: 6px 8px;">No. Historia</th>
                            <th style="padding: 6px 8px;">Descripción</th>
                            <th style="padding: 6px 8px;">Valor</th>
                            <th style="padding: 6px 8px;">Horas Est.</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (historiasAsignadas.length === 0) {
                htmlHistoriasAsignadas += `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #64748b; font-size: 12px;">Sin historias asignadas.</td></tr>`;
            } else {
                historiasAsignadas.forEach(hist => {
                    htmlHistoriasAsignadas += `
                        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 12px;">
                            <td style="padding: 6px 8px;">${hist.NoHistoria || hist.numeroDeHistoria || hist.id}</td>
                            <td style="padding: 6px 8px;">${hist.Descripccion || hist.descripcion || hist.nombre}</td>
                            <td style="padding: 6px 8px;">${hist.Valor || hist.valor || 0}</td>
                            <td style="padding: 6px 8px;">${hist.horasEstimadas || hist.horas || 0}</td>
                        </tr>
                    `;
                });
            }
            htmlHistoriasAsignadas += `</tbody></table>`;
            seccionDetalle.innerHTML = htmlHistoriasAsignadas;

            contenedorSprints.appendChild(seccionDetalle);
        });

    } catch (error) {
        console.error("Error al renderizar sprints:", error);
    }
}

/**
 * Método para desplegar/contraer la sección de historias asignadas debajo de la fila del sprint
 */
function toggleDetalleSprint(sprintId) {
    const detalle = document.getElementById(`detalleSprint_${sprintId}`);
    if (detalle) {
        detalle.style.display = detalle.style.display === "none" ? "block" : "none";
    }
}

/**
 * Listener para seleccionar una fila de Sprint
 */
function seleccionarFilaSprint(sprintId, elementoFila) {
    if (sprintSeleccionadoFilaDOM) {
        sprintSeleccionadoFilaDOM.style.backgroundColor = "";
        sprintSeleccionadoFilaDOM.style.color = ""; // Restablece el color de texto al deseleccionar
    }
    idSprintSeleccionado = sprintId;
    sprintSeleccionadoFilaDOM = elementoFila;
    sprintSeleccionadoFilaDOM.style.setProperty('background-color', '#3b82f6', 'important');
    sprintSeleccionadoFilaDOM.style.color = "#fff";
}

// ==========================================================
// MÉTODOS DE VERIFICACIÓN POR CADA CAMPO EN MODALES
// ==========================================================

function verificarNoIteracion(inputDOM, idExcluido = null) {
    const val = Number(inputDOM.value.trim());
    if (!Number.isInteger(val) || val < 1 || val > 100) {
        inputDOM.style.border = "2px solid red";
        inputDOM.value = "";
        inputDOM.placeholder = "Debe ser un número entero entre 1 y 100";
        return false;
    }
    // Verificar que no se repita en el proyecto
    for (let s of datosSprints) {
        const currentId = s.id || s.id_sprint;
        const currentIter = Number(s.NoSprint || s.no_iteracion);
        if (idExcluido !== null && currentId === idExcluido) continue;
        if (currentIter === val) {
            inputDOM.style.border = "2px solid red";
            inputDOM.value = "";
            inputDOM.placeholder = "Este número de iteración ya está en uso";
            return false;
        }
    }
    inputDOM.style.border = "2px solid blue";
    return true;
}

function verificarObjetivo(textareaDOM) {
    const val = textareaDOM.value.trim();
    if (val === "") {
        textareaDOM.style.border = "2px solid red";
        textareaDOM.placeholder = "El objetivo es obligatorio";
        return false;
    }
    if (!patronObjetivoSprint.test(val)) {
        textareaDOM.style.border = "2px solid red";
        textareaDOM.value = "";
        textareaDOM.placeholder = "Solo se permiten letras, ñ y acentos";
        return false;
    }
    textareaDOM.style.border = "2px solid blue";
    return true;
}

function verificarFechas(inputInicio, inputFin) {
    let valido = true;
    if (!inputInicio.value) {
        inputInicio.style.border = "2px solid red";
        valido = false;
    } else {
        inputInicio.style.border = "2px solid blue";
    }

    if (!inputFin.value) {
        inputFin.style.border = "2px solid red";
        valido = false;
    } else {
        inputFin.style.border = "2px solid blue";
    }

    if (valido && new Date(inputInicio.value) > new Date(inputFin.value)) {
        inputFin.style.border = "2px solid red";
        alert("La fecha fin no puede ser anterior a la fecha de inicio.");
        return false;
    }
    return true;
}

function validarCamposModalSprint(tipo, idExcluido = null) {
    const prefix = tipo === 'add' ? 'inpAdd' : 'inpMod';
    const inpIteracion = document.getElementById(`${prefix}NoIteracionSprint`);
    const txtObjetivo = document.getElementById(`${prefix}ObjetivoSprint`);
    const inpInicio = document.getElementById(`${prefix}FechaInicioSprint`);
    const inpFin = document.getElementById(`${prefix}FechaFinSprint`);

    const v1 = verificarNoIteracion(inpIteracion, idExcluido);
    const v2 = verificarObjetivo(txtObjetivo);
    const v3 = verificarFechas(inpInicio, inpFin);

    return v1 && v2 && v3;
}

// ==========================================================
// GESTIÓN DE PANELES DUALES (HISTORIAS ASIGNADAS Y CATÁLOGO)
// ==========================================================

async function cargarPanelesHistorias(asignadasIds = [], modalTipo = 'add') {
    const panelActual = document.getElementById(modalTipo === 'add' ? 'contenedorSprintAddActual' : 'contenedorSprintModActual');
    const panelCatalogo = document.getElementById(modalTipo === 'add' ? 'contenedorSprintAddCatalogo' : 'contenedorSprintModCatalogo');

    if (!panelActual || !panelCatalogo) return;

    panelActual.innerHTML = "";
    panelCatalogo.innerHTML = "";

    const todas = todasLasHistorias && todasLasHistorias.length > 0 ? todasLasHistorias : await obtenerHistorias(idProyectoActivo);

    todas.forEach(hist => {
        const histId = hist.id;
        const titulo = hist.nombre || hist.titulo || "Sin título";
        const sprintAsig = hist.sprint || hist.sprintAsig || hist.asignado_al_sprint;

        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-historia-dual";
        tarjeta.dataset.id = histId;
        tarjeta.style.cssText = "padding: 8px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; margin-bottom: 6px; font-size: 13px; user-select: none;";
        tarjeta.textContent = `#${hist.numeroDeHistoria || histId} - ${titulo}`;

        // Si pertenece a las asignadas a este sprint
        if (asignadasIds.includes(histId)) {
            tarjeta.onclick = () => {
                panelCatalogo.appendChild(tarjeta);
                tarjeta.onclick = () => { panelActual.appendChild(tarjeta); tarjeta.onclick = arguments.callee; };
            };
            panelActual.appendChild(tarjeta);
        } else if (!sprintAsig || sprintAsig === "" || sprintAsig === "#") {
            // Catálogo: Solo historias sin sprint asignado
            tarjeta.onclick = () => {
                panelActual.appendChild(tarjeta);
                tarjeta.onclick = () => { panelCatalogo.appendChild(tarjeta); tarjeta.onclick = arguments.callee; };
            };
            panelCatalogo.appendChild(tarjeta);
        }
    });
}

// ==========================================================
// MÉTODOS DE SOLICITUD FETCH (ALTAS, BAJAS, CAMBIOS)
// ==========================================================

async function agregarSprint() {
    if (!validarCamposModalSprint('add')) return;

    const noIteracion = document.getElementById('inpAddNoIteracionSprint').value.trim();
    const objetivo = document.getElementById('inpAddObjetivoSprint').value.trim();
    const fechaInicio = document.getElementById('inpAddFechaInicioSprint').value;
    const fechaFin = document.getElementById('inpAddFechaFinSprint').value;

    const historiasIds = Array.from(document.getElementById('contenedorSprintAddActual').children).map(t => Number(t.dataset.id));

    try {
        const respuesta = await fetch(`/sprints/guardar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idProyecto: idProyectoActivo,
                no_iteracion: noIteracion,
                objetivo: objetivo,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                historias: historiasIds
            })
        });

        const resultado = await respuesta.json();
        if (respuesta.ok && (resultado.ok || resultado.success || respuesta.status === 201)) {
            alert(resultado.mensaje || "Sprint agregado correctamente");
            document.getElementById("modalAgregarSprint").classList.remove('activo');
            await renderizarSprints();
            await inicializarBacklog();
        } else {
            alert(resultado.mensaje || "Error al guardar el sprint");
        }
    } catch (error) {
        console.error("Error en fetch agregar sprint:", error);
    }
}

async function modificarSprint() {
    if (!idSprintSeleccionado) {
        alert("Selecciona un sprint para modificar.");
        return;
    }
    if (!validarCamposModalSprint('mod', idSprintSeleccionado)) return;

    const noIteracion = document.getElementById('inpModNoIteracionSprint').value.trim();
    const objetivo = document.getElementById('inpModObjetivoSprint').value.trim();
    const fechaInicio = document.getElementById('inpModFechaInicioSprint').value;
    const fechaFin = document.getElementById('inpModFechaFinSprint').value;

    const historiasIds = Array.from(document.getElementById('contenedorSprintModActual').children).map(t => Number(t.dataset.id));

    try {
        const respuesta = await fetch(`/sprints/actualizar/${idSprintSeleccionado}/${idProyectoActivo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idProyecto: idProyectoActivo,
                no_iteracion: noIteracion,
                objetivo: objetivo,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                historias: historiasIds
            })
        });

        const resultado = await respuesta.json();
        if (respuesta.ok && (resultado.ok || resultado.success || respuesta.status === 200)) {
            alert(resultado.mensaje || "Sprint modificado correctamente");
            document.getElementById("modalModificarSprint").classList.remove('activo');
            await renderizarSprints();
            await inicializarBacklog();
        } else {
            alert(resultado.mensaje || "Error al modificar el sprint");
        }
    } catch (error) {
        console.error("Error en fetch modificar sprint:", error);
    }
}

function confirmarEliminarSprint(sprintId) {
    // Panel de confirmación blanco con botones azul para sí y rojo para no
    const modalConfirm = document.createElement("div");
    modalConfirm.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:2000;";
    modalConfirm.innerHTML = `
        <div style="background:#fff; padding:24px; border-radius:12px; border:2px solid #000; width:350px; text-align:center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <h3 style="margin-bottom:12px; color:#0f172a;">¿Estas seguro?</h3>
            <p style="margin-bottom:20px; color:#334155; font-size:14px;">¿Deseas eliminar este sprint?</p>
            <div style="display:flex; justify-content:center; gap:12px;">
                <button id="btnSiEliminarSprint" style="background:#0d8bf2; color:#fff; border:none; padding:8px 20px; border-radius:6px; font-weight:700; cursor:pointer;">Sí</button>
                <button id="btnNoEliminarSprint" style="background:#ff4444; color:#fff; border:none; padding:8px 20px; border-radius:6px; font-weight:700; cursor:pointer;">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalConfirm);

    document.getElementById("btnSiEliminarSprint").onclick = async () => {
        modalConfirm.remove();
        await eliminarSprintBD(sprintId);
    };
    document.getElementById("btnNoEliminarSprint").onclick = () => {
        modalConfirm.remove();
    };
}

async function eliminarSprintBD(sprintId) {
    try {
        const respuesta = await fetch(`/sprints/eliminar/${sprintId}/${idProyectoActivo}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });
        const resultado = await respuesta.json();
        if (respuesta.ok && (resultado.ok || resultado.success)) {
            alert(resultado.mensaje || "Sprint eliminado correctamente");
            await renderizarSprints();
            await inicializarBacklog();
        } else {
            alert(resultado.mensaje || "Error al eliminar sprint");
        }
    } catch (error) {
        console.error("Error en fetch eliminar sprint:", error);
    }
}

// ==========================================================
// LISTENERS DE APERTURA, CIERRE Y MODALES
// ==========================================================

const btnAgregarSprint = document.getElementById("btnAgregarSprint");
const btnModSprint = document.getElementById("btnModSprint");
const modalAgregarSprint = document.getElementById("modalAgregarSprint");
const modalModificarSprint = document.getElementById("modalModificarSprint");
const btnCerrarSprintAdd = document.getElementById("btnCerrarSprintAdd");
const btnCerrarSprintMod = document.getElementById("btnCerrarSprintMod");
const btnGuardarSprintAdd = document.getElementById("btnGuardarSprintAdd");
const btnGuardarSprintMod = document.getElementById("btnGuardarSprintMod");

if (btnAgregarSprint) {
    btnAgregarSprint.addEventListener("click", () => {
        document.getElementById("inpAddNoIteracionSprint").value = "";
        document.getElementById("inpAddObjetivoSprint").value = "";
        document.getElementById("inpAddFechaInicioSprint").value = "";
        document.getElementById("inpAddFechaFinSprint").value = "";
        cargarPanelesHistorias([], 'add');
        modalAgregarSprint.classList.add('activo');
    });
}

if (btnModSprint) {
    btnModSprint.addEventListener("click", () => {
        if (!idSprintSeleccionado) {
            alert("Debes seleccionar un sprint de la lista antes de modificar.");
            return;
        }
        const sprintObj = datosSprints.find(s => (s.id || s.id_sprint) === idSprintSeleccionado);
        if (!sprintObj) return;

        document.getElementById("inpModNoIteracionSprint").value = sprintObj.NoSprint || sprintObj.no_iteracion || "";
        document.getElementById("inpModObjetivoSprint").value = sprintObj.objetivo || sprintObj.objetivo_sprint || "";
        document.getElementById("inpModFechaInicioSprint").value = sprintObj.fechaInicio || sprintObj.fecha_inicio || "";
        document.getElementById("inpModFechaFinSprint").value = sprintObj.fechaFin || sprintObj.fecha_fin || "";

        const asignadasIds = (sprintObj.historiasAsignadas || sprintObj.historias || []).map(h => Number(h.id || h.id_historia));
        cargarPanelesHistorias(asignadasIds, 'mod');

        modalModificarSprint.classList.add('activo');
    });
}

if (btnCerrarSprintAdd) btnCerrarSprintAdd.addEventListener("click", () => modalAgregarSprint.classList.remove('activo'));
if (btnCerrarSprintMod) btnCerrarSprintMod.addEventListener("click", () => modalModificarSprint.classList.remove('activo'));
if (btnGuardarSprintAdd) btnGuardarSprintAdd.addEventListener("click", agregarSprint);
if (btnGuardarSprintMod) btnGuardarSprintMod.addEventListener("click", modificarSprint);

// Listener global para cerrar modales al hacer clic fuera del contenido blanco
window.addEventListener('click', (e) => {
    if (e.target === modalAgregarSprint) modalAgregarSprint.classList.remove('activo');
    if (e.target === modalModificarSprint) modalModificarSprint.classList.remove('activo');
});