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

    await obtenerImpedimentosSprintActual(sprintActual);
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

    const historiaId = Number(tarjeta.dataset.id);

    const ordenColumnas = {
        "por-empezar": 1,
        "en-progreso": 2,
        "en-revision": 3,
        "terminado": 4
    };

    const mueveHaciaAdelante = (ordenColumnas[estadoDestino] ?? 0) > (ordenColumnas[estadoAnterior] ?? 0);

    const tieneImpedimentoSinResolver = impedimentosCargados.some(imp =>
        Number(imp.id_historia) === historiaId &&
        String(imp.estado).toLowerCase() !== "resuelto"
    );

    if (mueveHaciaAdelante && tieneImpedimentoSinResolver) {
        mostrarNotificacionKanban(
            "Esta historia tiene un impedimento sin resolver y no puede avanzar en el tablero.",
            "error"
        );
        return;
    }

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

function mostrarNotificacionKanban(mensaje, tipo = "error") {
    let contenedor = document.getElementById("notificaciones-kanban-container");

    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "notificaciones-kanban-container";
        document.body.appendChild(contenedor);
    }

    const tipoValido = ["error", "exito", "info"].includes(tipo) ? tipo : "error";

    const toast = document.createElement("div");
    toast.className = `notificacion-kanban ${tipoValido}`;
    toast.textContent = mensaje;

    contenedor.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("visible");
    });

    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

async function actualizarEstadoHistoria(
    idHistoria,
    idProyecto,
    nuevoEstado
) {
    const datos = { nuevoEstado };

    if (nuevoEstado === "en-revision") {
        let horasValidas = false;

        while (!horasValidas) {
            const entrada = window.prompt(
                "Ingresa las horas reales TOTALES trabajadas en esta historia.\n" +
                "Si hubo correcciones, incluye también las horas anteriores.\n" +
                "Puedes usar hasta dos decimales. Ejemplo: 8.50"
            );

            // Cancelar: no enviar la petición ni cambiar el estado.
            if (entrada === null) return false;

            const texto = entrada.trim().replace(",", ".");
            const horas = Number(texto);

            if (
                !/^\d+(?:\.\d{1,2})?$/.test(texto) ||
                !Number.isFinite(horas) ||
                horas > 99999999.99
            ) {
                alert(
                    "Ingresa un número mayor o igual a cero, " +
                    "con máximo dos decimales."
                );
                continue;
            }

            datos.horasReales = horas;
            horasValidas = true;
        }
    }

    try {
        const respuesta = await fetch(
            `/historias/estado/${idHistoria}/${idProyecto}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.success === false) {
            alert(
                resultado.mensaje ||
                resultado.message ||
                "Error al actualizar el estado."
            );
            return false;
        }

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

//para impedimentos

const rolesVenImpedimentos = ["facilitador", "desarrollador"];
let impedimentosCargados = [];
let filtroImpedimentoActual = "pendiente";

function escaparHTML(texto) {
    const d = document.createElement("div");
    d.textContent = texto ?? "";
    return d.innerHTML;
}

// Muestra el botón solo a facilitador y desarrollador
function aplicarPermisosImpedimentos() {
    const visible = rolesVenImpedimentos.includes(ROL_ACTUAL);
    document.querySelectorAll(".ocultable-impedimentos").forEach(el => {
        el.style.display = visible ? "" : "none";
        el.dataset.permisoAplicado = "1";
    });
    const btnRegistrar = document.getElementById("btn-registrar-impedimento");
    if (btnRegistrar) btnRegistrar.style.display = ROL_ACTUAL === "desarrollador" ? "" : "none";
}

//el HTML del sprint se inyecta dinámicamente
new MutationObserver(() => {
    const btn = document.getElementById("btn-ver-impedimentos");
    if (btn && !btn.dataset.permisoAplicado) aplicarPermisosImpedimentos();
}).observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", async (e) => {
    if (e.target.closest("#btn-ver-impedimentos")) return abrirModalImpedimentos();
    if (e.target.closest("#btn-registrar-impedimento")) return mostrarFormularioImpedimento(true);
    if (e.target.closest("#btn-cancelar-impedimento")) return mostrarFormularioImpedimento(false);
    if (e.target.closest("#btn-guardar-impedimento")) return guardarImpedimento();

    const btnFiltro = e.target.closest(".btn-filtro-imp");
    if (btnFiltro) {
        filtroImpedimentoActual = btnFiltro.dataset.filtro;
        document.querySelectorAll(".btn-filtro-imp").forEach(b => {
            const activo = b === btnFiltro;
            b.classList.toggle("activo", activo);
            b.style.background = activo ? "#f8fafc" : "#fff";
        });
        renderizarTarjetasImpedimentos();
    }
});

function sincronizarBotonesFiltroImpedimentos() {
    document.querySelectorAll(".btn-filtro-imp").forEach(btn => {
        const activo = btn.dataset.filtro === filtroImpedimentoActual;
        btn.classList.toggle("activo", activo);
        btn.style.background = activo ? "#f8fafc" : "#fff";
        btn.style.fontWeight = activo ? "600" : "400";
    });
}

async function abrirModalImpedimentos() {
    const modal = document.getElementById("modal-gestion-impedimentos");
    if (!modal) return;
    aplicarPermisosImpedimentos();
    filtroImpedimentoActual = "pendiente";
    sincronizarBotonesFiltroImpedimentos();
    modal.style.display = "flex";
    await cargarImpedimentosEnModal();
}

function cerrarModalImpedimentos() {
    const modal = document.getElementById("modal-gestion-impedimentos");
    if (modal) modal.style.display = "none";
    mostrarFormularioImpedimento(false);
}

function validarSolucionImpedimento(texto) {
    const limpio = (texto || "").trim();

    if (!limpio) {
        return {
            valida: false,
            mensaje: "Debes escribir una solución antes de marcar el impedimento como resuelto."
        };
    }

    // Rechaza si el texto consiste casi únicamente en signos o símbolos sin letras
    const letras = limpio.match(/[a-záéíóúüñ]/gi) || [];
    if (letras.length < 10) {
        return {
            valida: false,
            mensaje: "No se aceptan solo signos o símbolos; escribe una solución descriptiva."
        };
    }

    // Rechaza repeticiones de un mismo carácter (ej. "aaaa", "qqqq")
    if (/(.)\1{3,}/i.test(limpio)) {
        return {
            valida: false,
            mensaje: "Escribe una solución real y descriptiva (no se permiten caracteres repetidos como 'aaaa' o 'qqqq')."
        };
    }

    // Rechaza 4 o más consonantes seguidas (típico de tecleo aleatorio)
    if (/[bcdfghjklmnpqrstvwxyzñ]{4,}/i.test(limpio)) {
        return {
            valida: false,
            mensaje: "El texto contiene combinaciones de letras poco naturales. Escribe una solución clara y real."
        };
    }

    const palabrasBrutas = limpio.split(/\s+/);
    
    // Evita bloques pegados demasiado largos sin espacios
    const hayBloqueExcesivo = palabrasBrutas.some(p => p.length > 18);
    if (hayBloqueExcesivo) {
        return {
            valida: false,
            mensaje: "Se detectó una palabra o cadena excesivamente larga sin espacios. Redacta una solución normal."
        };
    }

    const palabrasValidas = palabrasBrutas.filter(p => /[a-záéíóúüñ]{2,}/i.test(p));
    if (palabrasValidas.length < 3 || limpio.length < 15) {
        return {
            valida: false,
            mensaje: "Ingresa una solución más completa (al menos 3 palabras reales, sin símbolos sueltos ni texto repetitivo)."
        };
    }

    // Cada palabra de 6 o más letras debe tener al menos una vocal
    const tienePalabraSinVocales = palabrasValidas.some(palabra => {
        const soloLetras = (palabra.match(/[a-záéíóúüñ]/gi) || []).join("");
        return soloLetras.length >= 6 && !/[aeiouáéíóúü]/i.test(soloLetras);
    });

    if (tienePalabraSinVocales) {
        return {
            valida: false,
            mensaje: "El texto parece ser un tecleo aleatorio o sin sentido. Escribe una solución clara y real."
        };
    }

    // Proporción mínima de vocales en el texto completo
    const vocales = limpio.match(/[aeiouáéíóúü]/gi) || [];
    if (vocales.length < Math.ceil(letras.length * 0.28)) {
        return {
            valida: false,
            mensaje: "Ingresa una redacción comprensible con palabras reales antes de marcar como resuelto."
        };
    }

    return { valida: true, solucion: limpio };
}

async function obtenerImpedimentosSprintActual(sprintActual) {
    if (!proyectoActualKanban || !sprintActual) {
        impedimentosCargados = [];
        return;
    }
    try {
        const respuesta = await fetch(`/impedimentos/${proyectoActualKanban.id}/${sprintActual}`);
        const resultado = await respuesta.json();
        impedimentosCargados = (respuesta.ok && resultado.success) ? (resultado.data || []) : [];
    } catch (error) {
        console.error("Error al sincronizar impedimentos:", error);
        impedimentosCargados = [];
    }
}

async function cargarImpedimentosEnModal() {
    const selectSprint = document.getElementById("select-no-iteracion");
    const sprintActual = selectSprint ? selectSprint.value : "";
    await obtenerImpedimentosSprintActual(sprintActual);
    renderizarTarjetasImpedimentos();
}

function esImpedimentoPropio(imp) {
    if (!usuarioActualKanban) return false;

    const idReportante = imp.id_usuario_reporta ?? imp.id_usuario ?? imp.usuario_id;
    if (idReportante !== undefined && idReportante !== null && usuarioActualKanban.id !== undefined) {
        return Number(idReportante) === Number(usuarioActualKanban.id);
    }

    const nombreActual = String(usuarioActualKanban.nombre ?? usuarioActualKanban.usuario ?? "").trim().toLowerCase();
    const nombreReportante = String(imp.nombre_desarrollador ?? "").trim().toLowerCase();
    return Boolean(nombreActual && nombreReportante && nombreActual === nombreReportante);
}

function renderizarTarjetasImpedimentos() {
    const contenedor = document.getElementById("lista-impedimentos-container");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const lista = impedimentosCargados.filter(i =>
        filtroImpedimentoActual === "todos" || i.estado === filtroImpedimentoActual
    );

    if (lista.length === 0) {
        contenedor.innerHTML = `<p style="text-align:center; color:#64748b;">No hay impedimentos para mostrar en este sprint.</p>`;
        return;
    }

    lista.forEach(imp => {
        const esResuelto = imp.estado === "resuelto";
        const borderColor = esResuelto ? "#86efac" : "#fecaca";
        const bgColor = esResuelto ? "#f0fdf4" : "#fef2f2";

        let htmlResolucion = "";
        if (ROL_ACTUAL === "facilitador" && !esResuelto) {
            htmlResolucion = `
                <div style="border-top:1px dashed #fca5a5; padding-top:8px; margin-top:8px;">
                    <textarea id="solucion-${imp.id}" placeholder="Escribe una solución detallada (mínimo 3 palabras reales)..." style="width:100%; padding:6px; margin-bottom:6px; box-sizing:border-box;"></textarea>
                    <button type="button" id="btn-resolver-${imp.id}" onclick="marcarResuelto(${imp.id})" disabled style="background:#16a34a; color:#fff; border:none; padding:6px 12px; border-radius:4px; opacity:0.55; cursor:not-allowed;">Marcar como Resuelto</button>
                </div>`;
        } else if (esResuelto) {
            htmlResolucion = `<p style="margin:4px 0 0; color:#166534; font-size:13px;"><strong>Solución:</strong> ${escaparHTML(imp.solucion)}</p>`;
        }

        const nombreDesarrollador = escaparHTML(imp.nombre_desarrollador);
        const etiquetaPropia = esImpedimentoPropio(imp)
            ? ` <span style="color:#2563eb; font-weight:700;">(Tú)</span>`
            : "";

        const fecha = imp.fecha_reporte ? formatearFechaSimple(String(imp.fecha_reporte)) : "";
        const tarjeta = document.createElement("div");
        tarjeta.className = `tarjeta-impedimento ${esResuelto ? "resuelto" : "pendiente"}`;
        tarjeta.style.cssText = `border:1px solid ${borderColor}; background:${bgColor}; border-left:4px solid ${esResuelto ? "#22c55e" : "#ef4444"}; border-radius:8px; padding:12px;`;
        tarjeta.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>${escaparHTML(imp.nombre_historia)}</strong>
                <span style="font-size:12px; font-weight:bold; color:${esResuelto ? "#166534" : "#991b1b"};">${escaparHTML((imp.estado || "").toUpperCase())}</span>
            </div>
            <p style="margin:4px 0; font-size:13px;">Reportado por: <strong>${nombreDesarrollador}</strong>${etiquetaPropia} ${fecha ? "| " + fecha : ""}</p>
            <p style="margin:4px 0; font-size:14px;">${escaparHTML(imp.descripcion)}</p>
            ${htmlResolucion}
        `;
        contenedor.appendChild(tarjeta);

        if (ROL_ACTUAL === "facilitador" && !esResuelto) {
            const txtSolucion = document.getElementById(`solucion-${imp.id}`);
            if (txtSolucion) {
                txtSolucion.addEventListener("input", () => actualizarEstadoBotonResolver(imp.id));
            }
        }
    });
}

function actualizarEstadoBotonResolver(idImpedimento) {
    const txt = document.getElementById(`solucion-${idImpedimento}`);
    const btn = document.getElementById(`btn-resolver-${idImpedimento}`);
    if (!txt || !btn) return;

    const esValida = validarSolucionImpedimento(txt.value).valida;
    btn.disabled = !esValida;
    btn.style.opacity = esValida ? "1" : "0.55";
    btn.style.cursor = esValida ? "pointer" : "not-allowed";
}

//el desarrollador registra un impedimento 
function mostrarFormularioImpedimento(mostrar) {
    const form = document.getElementById("form-impedimento");
    if (!form) return;
    form.style.display = mostrar ? "block" : "none";
    if (!mostrar) return;

    const select = document.getElementById("imp-historia");
    const btnGuardar = document.getElementById("btn-guardar-impedimento");
    select.innerHTML = "";

    const historiasElegibles = historiasDelSprint.filter(h => {
        const estado = h.estado_actual ?? h.estado;
        return estado === "en-progreso" || estado === "en-revision";
    });

    if (historiasElegibles.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No tienes historias en 'En progreso' o 'En revisión'";
        select.appendChild(opt);
        select.disabled = true;
        if (btnGuardar) btnGuardar.disabled = true;
    } else {
        select.disabled = false;
        if (btnGuardar) btnGuardar.disabled = false;

        historiasElegibles.forEach(h => {
            const opt = document.createElement("option");
            opt.value = h.historia_id ?? h.id;
            opt.textContent = h.titulo ?? h.descripcion ?? "Historia sin título";
            select.appendChild(opt);
        });
    }

    document.getElementById("imp-descripcion").value = "";
}

async function guardarImpedimento() {
    const idHistoria = Number(document.getElementById("imp-historia").value);
    const descripcion = document.getElementById("imp-descripcion").value.trim();
    const idSprint = Number(document.getElementById("select-no-iteracion")?.value);

    if (!idHistoria || !idSprint || !descripcion) {
        alert("Selecciona una historia y describe el impedimento.");
        return;
    }

    try {
        const respuesta = await fetch("/impedimentos/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idProyecto: proyectoActualKanban.id,
                idSprint,
                idHistoria,
                idUsuarioReporta: usuarioActualKanban.id,
                descripcion
            })
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.success) {
            alert(resultado.mensaje || "No se pudo registrar el impedimento.");
            return;
        }
        mostrarFormularioImpedimento(false);
        await obtenerImpedimentosSprintActual(idSprint);
        renderizarTarjetasImpedimentos();
    } catch (error) {
        console.error("Error al registrar impedimento:", error);
        alert("Error de conexión al registrar el impedimento.");
    }
}

//el facilitador resuelve el impedimento
async function marcarResuelto(idImpedimento) {
    const txtSolucion = document.getElementById(`solucion-${idImpedimento}`);
    const validacion = validarSolucionImpedimento(txtSolucion ? txtSolucion.value : "");

    if (!validacion.valida) {
        if (typeof mostrarNotificacionKanban === "function") {
            mostrarNotificacionKanban(validacion.mensaje, "error");
        } else {
            alert(validacion.mensaje);
        }
        return;
    }

    try {
        const respuesta = await fetch(`/impedimentos/resolver/${idImpedimento}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ solucion: validacion.solucion })
        });
        const resultado = await respuesta.json();
        if (resultado.success) {
            await cargarImpedimentosEnModal();
            if (typeof mostrarNotificacionKanban === "function") {
                mostrarNotificacionKanban("Impedimento marcado como resuelto.", "exito");
            }
        } else {
            alert(resultado.mensaje || "No se pudo resolver el impedimento.");
        }
    } catch (error) {
        console.error("Error al resolver impedimento:", error);
    }
}