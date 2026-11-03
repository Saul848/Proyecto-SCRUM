// LÓGICA DE PRODUCT BACKLOG 

let todasLasHistorias = [];

/**
 * Configurar permisos y visibilidad según el rol (Facilitador vs Desarrollador)
 */
window.aplicarReglasPermisosYEstado = function() {
    const zonaCarga = document.getElementById("kanban-evidencias-zona-carga");
    const alertaTexto = document.getElementById("kanban-evidencias-alerta-texto");

    // Verificamos de forma segura si la variable global ya existe; si no, asignamos el rol por defecto de esta vista
    if (typeof ROL_ACTUAL === 'undefined') {
        var ROL_ACTUAL = window.location.href.includes('Facilitador') ? "facilitador" : "desarrollador";
    }

    const rolActual = ROL_ACTUAL.toLowerCase().trim();
    console.log("Rol detectado:", rolActual);

    if (rolActual === "desarrollador") {
        if (zonaCarga) zonaCarga.style.setProperty("display", "none", "important");
        if (alertaTexto) alertaTexto.textContent = "Material compartido por el facilitador para consulta y descarga.";
    } else {
        // Como estás en el panel de facilitador, forzamos que se muestre la zona de carga
        if (zonaCarga) zonaCarga.style.setProperty("display", "block", "important");
        if (alertaTexto) alertaTexto.textContent = "Puedes subir imágenes PNG, JPG, PDF o ZIP y borrar las que tú subiste.";
    }
}

// Esperamos a que el DOM cargue por completo antes de buscar elementos o asignar eventos
document.addEventListener("DOMContentLoaded", () => {
    const btnVerMaterial = document.getElementById("btn-ver-material");
    const modalVerMaterial = document.getElementById("modalVerMaterial");
    const btnCerrarModalVerMaterial = document.getElementById("btnCerrarModalVerMaterial");

    if (btnVerMaterial) {
        console.log("¡Botón #btn-ver-material encontrado con éxito!");
    } else {
        console.warn("Advertencia: No se encontró el botón #btn-ver-material en el DOM.");
    }

    if (modalVerMaterial) {
        console.log("¡Modal #modalVerMaterial encontrado con éxito!");
    } else {
        console.warn("Advertencia: No se encontró el modal #modalVerMaterial en el DOM.");
    }

    // Configurar evento clic del botón principal
    if (btnVerMaterial) {
        btnVerMaterial.addEventListener("click", async () => {
            console.log("¡Click detectado en el botón ver material!");
            
            window.ROL_ACTUAL = "desarrollador"; 
            window.aplicarReglasPermisosYEstado();

            const modalEvidencias = document.getElementById("mi-modal-evidencias-general");
            if (modalEvidencias) {
                modalEvidencias.style.setProperty("display", "flex", "important");
                modalEvidencias.style.setProperty("z-index", "9999", "important");
                console.log("¡Modal abierto con éxito!");
            }
            
            await cargarMaterialesAdicionales();
        });
    }

    // Cerrar con botón de cerrar
    if (btnCerrarModalVerMaterial && modalVerMaterial) {
        btnCerrarModalVerMaterial.addEventListener("click", () => {
            modalVerMaterial.style.display = "none";
        });
    }

    // Cerrar haciendo clic fuera del modal
    window.addEventListener("click", (e) => {
        if (modalVerMaterial && e.target === modalVerMaterial) {
            modalVerMaterial.style.display = "none";
        }
    });

    // Configurar filtros en tiempo real
    const inputFiltroId = document.getElementById("inputFiltroId");
    const inputFiltroNombre = document.getElementById("inputFiltroNombre");
    const inputFiltroValor = document.getElementById("inputFiltroValor");
    const inputFiltroSprint = document.getElementById("inputFiltroSprint");
    const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

    if (inputFiltroId && inputFiltroNombre && inputFiltroValor && inputFiltroSprint) {
        [inputFiltroId, inputFiltroNombre, inputFiltroValor, inputFiltroSprint].forEach(input => {
            input.addEventListener("input", aplicarFiltrosDesarrollador);
        });
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener("click", () => {
            if (inputFiltroId) inputFiltroId.value = "";
            if (inputFiltroNombre) inputFiltroNombre.value = "";
            if (inputFiltroValor) inputFiltroValor.value = "";
            if (inputFiltroSprint) inputFiltroSprint.value = "";
            aplicarFiltrosDesarrollador();
        });
    }

    const cabeceraMensajes = document.getElementById("cabecera-mensajes");
    if (cabeceraMensajes) {
        cabeceraMensajes.classList.add("activa");
    }

    inicializarBacklogDesarrollador();
});

// Función para cargar los materiales dinámicamente usando los IDs correctos
async function cargarMaterialesAdicionales() {
    const contenedorListaMateriales = document.getElementById("kanban-evidencias-lista-archivos");
    if (!contenedorListaMateriales) return;

    try {
        contenedorListaMateriales.innerHTML = '<p>Cargando archivos...</p>';
        
        // Usamos la misma lógica del facilitador: Proyecto 1 e Historia 0 para material general
        const idProyecto = window.ID_PROYECTO_ACTUAL || (window.historiaActualEvidencias && window.historiaActualEvidencias.id_proyecto) || sessionStorage.getItem('idProyecto') || 1; 
        const idHistoria = (window.historiaActualEvidencias && window.historiaActualEvidencias.historia_id !== undefined) ? window.historiaActualEvidencias.historia_id : 0; 

        console.log(`Cargando material general -> Proyecto: ${idProyecto}, Historia: ${idHistoria}`);

        const response = await fetch(`/historias/evidencias/${idProyecto}/${idHistoria}`); 
        if (!response.ok) throw new Error('Error al obtener los materiales');

        const resultado = await response.json();
        const archivos = resultado.data || resultado || [];

        if (!archivos || archivos.length === 0) {
            contenedorListaMateriales.innerHTML = '<div class="sin-archivos">No hay evidencias o material general subido aún.</div>';
            return;
        }

        contenedorListaMateriales.innerHTML = '';
        archivos.forEach(archivo => {
            const fechaFormateada = new Date(archivo.fecha_subida || Date.now()).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const nombreArchivo = archivo.nombre_original || archivo.nombre;
            const urlArchivo = archivo.ruta_archivo || archivo.url || `/evidencias/${idProyecto}/${idHistoria}/${nombreArchivo}`;

            const itemHTML = `
                <div class="item-material-card" data-url="${urlArchivo}" data-nombre="${nombreArchivo}" style="cursor: pointer;">
                    <div class="material-info">
                        <p><strong>${nombreArchivo}</strong></p>
                        <span>Subido el: ${fechaFormateada}</span>
                    </div>
                    <a href="${urlArchivo}" target="_blank" download class="btn-descargar-archivo">
                        Descargar
                    </a>
                </div>
            `;
            contenedorListaMateriales.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Activar evento de clic para la Vista Previa
        const tarjetasArchivos = contenedorListaMateriales.querySelectorAll('.item-material-card');
        tarjetasArchivos.forEach(tarjeta => {
            tarjeta.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') return; 

                const url = tarjeta.getAttribute('data-url');
                const nombre = tarjeta.getAttribute('data-nombre');

                const previewContent = document.getElementById("kanban-evidencias-preview-content");

                if (previewContent) {
                    previewContent.innerHTML = `
                        <img src="${url}" alt="${nombre}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px; margin-bottom: 5px;" />
                        <span id="kanban-evidencias-preview-nombre" class="preview-nombre-archivo" style="font-weight: 500; font-size: 13px; color: #2d3748;">${nombre}</span>
                    `;
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar evidencias:', error);
        contenedorListaMateriales.innerHTML = '<div class="sin-archivos" style="color: #e53e3e;">Hubo un error al cargar los archivos.</div>';
    }
}
// Funciones de la tabla
async function obtenerHistorias() {
    try {
        const respuesta = await fetch(`/historias`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (!respuesta.ok) return [];
        const datos = await respuesta.json();
        return datos.data || datos || [];
    } catch (error) {
        return [];
    }
}

async function inicializarBacklogDesarrollador() {
    todasLasHistorias = await obtenerHistorias();
    aplicarFiltrosDesarrollador();
}

function aplicarFiltrosDesarrollador() {
    const inputFiltroId = document.getElementById("inputFiltroId");
    const inputFiltroNombre = document.getElementById("inputFiltroNombre");
    const inputFiltroValor = document.getElementById("inputFiltroValor");
    const inputFiltroSprint = document.getElementById("inputFiltroSprint");

    const filtroId = inputFiltroId ? inputFiltroId.value.trim().toLowerCase() : "";
    const filtroNombre = inputFiltroNombre ? inputFiltroNombre.value.trim().toLowerCase() : "";
    const filtroValor = inputFiltroValor ? inputFiltroValor.value.trim().toLowerCase() : "";
    const filtroSprint = inputFiltroSprint ? inputFiltroSprint.value.trim().toLowerCase() : "";

    const historiasFiltradas = todasLasHistorias.filter((historia) => {
        const idStr = String(historia.id || "").toLowerCase();
        const nombreStr = String(historia.nombre || historia.titulo || "").toLowerCase();
        const valorStr = String(historia.valor || "").toLowerCase();
        const sprintStr = String(historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "").toLowerCase();

        return (filtroId === "" || idStr.includes(filtroId)) &&
               (filtroNombre === "" || nombreStr.includes(filtroNombre)) &&
               (filtroValor === "" || valorStr.includes(filtroValor)) &&
               (filtroSprint === "" || sprintStr.includes(filtroSprint));
    });

    renderizarTablaDesarrollador(historiasFiltradas);
}

function renderizarTablaDesarrollador(historias) {
    const divHistoria = document.getElementById("DivHistoria");
    if (!divHistoria) return;

    divHistoria.innerHTML = "";

    if (!historias || historias.length === 0) {
        divHistoria.innerHTML = `<p style="text-align: center; padding: 20px; color: #64748b;">No se encontraron historias de usuario registradas.</p>`;
        return;
    }

    historias.forEach((historia) => {
        const filaHtml = document.createElement("div");
        filaHtml.id = `DivFilaHistoria_${historia.id}`;
        filaHtml.className = "fila-historia-item";

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.id || "#"}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo || "Sin título"}</label>
            <label class="LabelDescripccion">${historia.descripcion || historia.descripccion || "#"}</label>
            <label class="LabelCriterios">${historia.criterios || historia.criterios_de_aceptacion || "#"}</label>
            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelSprintAsginado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
        `;

        // Al hacer clic en una historia de la tabla, guardamos sus IDs globalmente para que el botón de ver material los use
        filaHtml.addEventListener("click", () => {
            window.ID_PROYECTO_ACTUAL = historia.idProyecto || historia.proyecto_id || 1; // Ajusta según tu base de datos
            window.ID_HISTORIA_ACTUAL = historia.id;
            console.log(`Historia seleccionada -> Proyecto: ${window.ID_PROYECTO_ACTUAL}, Historia: ${window.ID_HISTORIA_ACTUAL}`);
        });

        divHistoria.appendChild(filaHtml);
    });
}