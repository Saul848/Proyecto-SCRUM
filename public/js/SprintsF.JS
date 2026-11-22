// ==========================================================
// GESTIÓN DE SPRINTS - CRUD COMPLETO Y LÓGICA DE PANELES
// ==========================================================

// Variable global para almacenar la lista de sprints recuperada de la base de datos
let datosSprints = [];
let idSprintSeleccionado = null;
let sprintSeleccionadoFilaDOM = null;

// Patrón regular para validar objetivos (admite letras de la a a la z, ñ y acentos)
let patronObjetivoSprint = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\x20]+$/;

// Ejecución inicial al cargar el DOM del panel de gestión
document.addEventListener("DOMContentLoaded", async () => {
    configurarEventosBotonesEstado();
    if (document.getElementById("DivSprint")) {
        await renderizarSprints();
    }
});

/**
 * Configura los eventos de clic para los botones estáticos de Iniciar y Terminar Sprint.
 */
function configurarEventosBotonesEstado() {
    const btnIniciar = document.getElementById("btnIniciarSprint");
    const btnTerminar = document.getElementById("btnTerminarSprint");

    if (btnIniciar) {
        btnIniciar.onclick = () => cambiarEstadoSprintSeleccionado('en progreso');
    }

    if (btnTerminar) {
        btnTerminar.onclick = () => cambiarEstadoSprintSeleccionado('terminado');
    }
}

/**
 * Obtiene la lista de sprints de la base de datos,
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
        datosSprints.sort((a, b) => Number(a.NoSprint || a.no_iteracion || 0) - Number(b.NoSprint || b.no_iteracion || 0));

        contenedorSprints.innerHTML = "";

        if (datosSprints.length === 0) {
            contenedorSprints.innerHTML = `<p style="text-align: center; padding: 20px; color: #64748b;">No hay sprints registrados en este proyecto.</p>`;
            actualizarVisibilidadBotonesEstado(null);
            return;
        }

        datosSprints.forEach(sprint => {
            const sprintId = sprint.Id || sprint.id || sprint.id_sprint;
            const noSprint = sprint.NoSprint || sprint.no_iteracion;
            const objetivo = sprint.objetivo || sprint.objetivo_sprint;
            const estado = sprint.estado || "planeado";
            const fechaInicio = sprint.fechaInicio || sprint.fecha_inicio;
            const fechaFin = sprint.fechaFin || sprint.fecha_fin;
            const historiasAsignadas = sprint.historiasAsignadas || sprint.historias || [];

            const filaSprint = document.createElement("div");
            filaSprint.className = "DivFilaSprint";
            filaSprint.id = `DivFilaSprint_${sprintId}`;

            filaSprint.addEventListener("click", (e) => {
                if (e.target.closest('.btn-toggle-sprint') || e.target.closest('.btn-accion-sprint')) return;
                seleccionarFilaSprint(sprintId, filaSprint);
            });

            filaSprint.innerHTML = `
                <label>${noSprint}</label>
                <label>${objetivo}</label>
                <label><span style="padding: 2px 8px; border-radius: 4px; background: ${estado === 'en progreso' ? '#10b981' : estado === 'terminado' ? '#64748b' : '#3b82f6'}; color: #fff; font-size: 11px;">${estado}</span></label>
                <label>${fechaInicio}</label>
                <label>${fechaFin}</label>
                <div class="div-acciones-sprint" style="display: flex; gap: 6px; justify-content: center;">
                    <button type="button" class="btn-toggle-sprint" title="Ver historias asignadas" onclick="toggleDetalleSprint(${sprintId})" style="background:#0d8bf2; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">📖</button>
                    <button type="button" class="btn-accion-sprint" title="Eliminar Sprint" onclick="confirmarEliminarSprint(${sprintId})" style="background:#ff4444; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">🗑️</button>
                </div>
            `;
            contenedorSprints.appendChild(filaSprint);

            const seccionDetalle = document.createElement("div");
            seccionDetalle.id = `detalleSprint_${sprintId}`;
            seccionDetalle.className = "seccion-detalle-sprint-desplegada";
            seccionDetalle.style.cssText = "display: none; grid-column: 1 / -1; padding: 12px; background: #f1f5f9; border-radius: 8px; margin-top: 4px; margin-bottom: 8px;";

            let htmlHistoriasAsignadas = `
                <h4 style="margin-bottom: 8px; color: #1e293b; font-size: 13px;">Historias de Usuario Asignadas al Sprint ${noSprint}</h4>
                <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden;">
                    <thead>
                        <tr style="background: #e2e8f0; font-size: 12px; text-align: left;">
                            <th style="padding: 6px 8px;">No. Historia</th>
                            <th style="padding: 6px 8px;">Descripción</th>
                            <th style="padding: 6px 8px;">Valor</th>
                            <th style="padding: 6px 8px;">Horas Est.</th>
                            <th style="padding: 6px 8px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (historiasAsignadas.length === 0) {
                htmlHistoriasAsignadas += `<tr><td colspan="5" style="padding: 8px; text-align: center; color: #64748b; font-size: 12px;">Sin historias asignadas.</td></tr>`;
            } else {
                historiasAsignadas.forEach(hist => {
                    const esPendiente = hist.pendiente;
                    htmlHistoriasAsignadas += `
                        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 12px; ${esPendiente ? 'background-color: #ffedd5;' : ''}">
                            <td style="padding: 6px 8px;">${hist.NoHistoria || hist.numeroDeHistoria || hist.id}</td>
                            <td style="padding: 6px 8px;">${hist.Descripccion || hist.descripcion || hist.nombre}</td>
                            <td style="padding: 6px 8px;">${hist.Valor || hist.valor || 0}</td>
                            <td style="padding: 6px 8px;">${hist.horasEstimadas || hist.horas || 0}</td>
                            <td style="padding: 6px 8px;">${esPendiente ? '<span style="color: #c2410c; font-weight: bold;">pendiente</span>' : 'normal'}</td>
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
 * Despliega o contrae la sección de historias asignadas debajo de la fila del sprint correspondiente.
 */
function toggleDetalleSprint(sprintId) {
    const detalle = document.getElementById(`detalleSprint_${sprintId}`);
    if (detalle) {
        detalle.style.display = detalle.style.display === "none" ? "block" : "none";
    }
}

/**
 * Selecciona una fila de sprint en el DOM, actualiza su estilo visual y gestiona la visibilidad de los botones de estado.
 */
function seleccionarFilaSprint(sprintId, elementoFila) {
    if (sprintSeleccionadoFilaDOM) {
        sprintSeleccionadoFilaDOM.style.backgroundColor = "";
        sprintSeleccionadoFilaDOM.style.color = "";
    }
    idSprintSeleccionado = sprintId;
    sprintSeleccionadoFilaDOM = elementoFila;
    sprintSeleccionadoFilaDOM.style.setProperty('background-color', '#3b82f6', 'important');
    sprintSeleccionadoFilaDOM.style.color = "#fff";

    const sprintObj = datosSprints.find(s => Number(s.Id || s.id || s.id_sprint) === Number(sprintId));
    actualizarVisibilidadBotonesEstado(sprintObj ? sprintObj.estado : null);
}

/**
 * Controla la visibilidad dinámica de los botones "Iniciar Sprint" y "Terminar Sprint"
 * según el estado actual del sprint seleccionado.
 */
function actualizarVisibilidadBotonesEstado(estadoSprint) {
    const btnIniciar = document.getElementById("btnIniciarSprint");
    const btnTerminar = document.getElementById("btnTerminarSprint");

    if (!btnIniciar || !btnTerminar) return;

    if (!idSprintSeleccionado || !estadoSprint) {
        btnIniciar.style.display = "none";
        btnTerminar.style.display = "none";
        return;
    }

    if (estadoSprint === 'planeado') {
        btnIniciar.style.display = "inline-block";
        btnTerminar.style.display = "none";
    } else if (estadoSprint === 'en progreso') {
        btnIniciar.style.display = "none";
        btnTerminar.style.display = "inline-block";
    } else {
        btnIniciar.style.display = "none";
        btnTerminar.style.display = "none";
    }
}

/**
 * Envía una solicitud para actualizar el estado del sprint seleccionado en el servidor.
 */
async function cambiarEstadoSprintSeleccionado(nuevoEstado) {
    if (!idSprintSeleccionado) return;

    try {
        const respuesta = await fetch(`/sprints/estado/${idSprintSeleccionado}/${idProyectoActivo}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevoEstado })
        });
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.ok) {
            alert(resultado.mensaje);
            await renderizarSprints();
            idSprintSeleccionado = null;
            sprintSeleccionadoFilaDOM = null;
            actualizarVisibilidadBotonesEstado(null);
        } else {
            alert(resultado.mensaje || "Error al cambiar el estado del sprint.");
        }
    } catch (error) {
        console.error("Error al cambiar estado del sprint:", error);
    }
}

/**
 * Carga los paneles duales ordenando las historias con `pendiente = true` en la parte superior,
 * aplicando fondo naranja y la etiqueta correspondiente.
 */
async function cargarPanelesHistorias(asignadasIds = [], modalTipo = 'add') {
    const panelActual = document.getElementById(modalTipo === 'add' ? 'contenedorSprintAddActual' : 'contenedorSprintModActual');
    const panelCatalogo = document.getElementById(modalTipo === 'add' ? 'contenedorSprintAddCatalogo' : 'contenedorSprintModCatalogo');

    if (!panelActual || !panelCatalogo) return;

    panelActual.innerHTML = "";
    panelCatalogo.innerHTML = "";

    const todas = todasLasHistorias && todasLasHistorias.length > 0 ? todasLasHistorias : await obtenerHistorias(idProyectoActivo);

    const todasOrdenadas = [...todas].sort((a, b) => (b.pendiente === true) - (a.pendiente === true));

    todasOrdenadas.forEach(hist => {
        const histId = hist.id;
        const titulo = hist.nombre || hist.titulo || "Sin título";
        const sprintAsig = hist.sprint || hist.sprintAsig || hist.asignado_al_sprint;
        const esPendiente = hist.pendiente === true;

        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-historia-dual";
        tarjeta.dataset.id = histId;
        
        let estiloTarjeta = "padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 6px; font-size: 13px; user-select: none; display: flex; justify-content: space-between; align-items: center;";
        if (esPendiente) {
            estiloTarjeta += " background: #ffedd5; border: 1px solid #f97316; color: #9a3412;";
        } else {
            estiloTarjeta += " background: #fff; border: 1px solid #cbd5e1; color: #0f172a;";
        }
        tarjeta.style.cssText = estiloTarjeta;

        const contenidoTexto = document.createElement("span");
        contenidoTexto.textContent = `#${hist.numeroDeHistoria || histId} - ${titulo}`;
        tarjeta.appendChild(contenidoTexto);

        if (esPendiente) {
            const badgePendiente = document.createElement("span");
            badgePendiente.textContent = "pendiente";
            badgePendiente.style.cssText = "background: #f97316; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;";
            tarjeta.appendChild(badgePendiente);
        }

        if (asignadasIds.includes(histId)) {
            tarjeta.onclick = () => {
                panelCatalogo.appendChild(tarjeta);
            };
            panelActual.appendChild(tarjeta);
        } else if (!sprintAsig || sprintAsig === "" || sprintAsig === "#") {
            tarjeta.onclick = () => {
                panelActual.appendChild(tarjeta);
            };
            panelCatalogo.appendChild(tarjeta);
        }
    });
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
        alert("Se debe seleccionar un sprint para modificar.");
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
    const modalConfirm = document.createElement("div");
    modalConfirm.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:2000;";
    modalConfirm.innerHTML = `
        <div style="background:#fff; padding:24px; border-radius:12px; border:2px solid #000; width:350px; text-align:center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <h3 style="margin-bottom:12px; color:#0f172a;">¿Estás seguro?</h3>
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
            alert("Se debe seleccionar un sprint de la lista antes de modificar.");
            return;
        }
        const sprintObj = datosSprints.find(s => Number(s.Id || s.id || s.id_sprint) === Number(idSprintSeleccionado));
        if (!sprintObj) {
            alert("No se encontró la información del sprint seleccionado.");
            return;
        }

        document.getElementById("inpModNoIteracionSprint").value = sprintObj.NoSprint || sprintObj.no_iteracion || "";
        document.getElementById("inpModObjetivoSprint").value = sprintObj.objetivo || sprintObj.objetivo_sprint || "";
        document.getElementById("inpModFechaInicioSprint").value = sprintObj.fechaInicio || sprintObj.fecha_inicio || "";
        document.getElementById("inpModFechaFinSprint").value = sprintObj.fechaFin || sprintObj.fecha_fin || "";

        const asignadasIds = (sprintObj.historiasAsignadas || sprintObj.historias || []).map(h => Number(h.ID || h.id || h.id_historia));
        cargarPanelesHistorias(asignadasIds, 'mod');

        modalModificarSprint.classList.add('activo');
    });
}

// Escuchadores de eventos para cerrar los modales mediante los botones correspondientes
if (btnCerrarSprintAdd) {
    btnCerrarSprintAdd.addEventListener("click", () => {
        modalAgregarSprint.classList.remove('activo');
    });
}

if (btnCerrarSprintMod) {
    btnCerrarSprintMod.addEventListener("click", () => {
        modalModificarSprint.classList.remove('activo');
    });
}

// Escuchadores de eventos para los botones de guardado
if (btnGuardarSprintAdd) {
    btnGuardarSprintAdd.addEventListener("click", agregarSprint);
}

if (btnGuardarSprintMod) {
    btnGuardarSprintMod.addEventListener("click", modificarSprint);
}

// Escuchador global en la ventana para cerrar los modales al hacer clic fuera de su contenido principal
window.addEventListener('click', (e) => {
    if (e.target === modalAgregarSprint) {
        modalAgregarSprint.classList.remove('activo');
    }
    if (e.target === modalModificarSprint) {
        modalModificarSprint.classList.remove('activo');
    }
});