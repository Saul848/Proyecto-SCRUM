let historiaSeleccionadaKanban = null;

/**
 * Carga el HTML del modal mediante fetch la primera vez que se necesita
 */
async function asegurarModalCargadoDetallesHistoria() {
    // Si ya existe en el DOM, no hace nada
    if (document.getElementById("modal-detalle-historia-kanban")) return;

    try {
        // Asegúrate de poner la ruta correcta hacia tu archivo .html separado
        const respuesta = await fetch('../html/modalDetalleHistoriaKanban.html');
        if (!respuesta.ok) {
            console.error("No se pudo cargar el archivo HTML del modal.");
            return;
        }
        const html = await respuesta.text();

        //Inyectarlo dentro de la zona de trabajo para mantener orden
        const zonaTrabajo = document.getElementById("zonaDeTrabajo");
        if (zonaTrabajo) {
            zonaTrabajo.insertAdjacentHTML('beforeend', html);
        } else {
            // Fallback por si la zona de trabajo no se encuentra
            document.body.insertAdjacentHTML('beforeend', html);
        }
    } catch (error) {
        console.error("Error de red al intentar cargar el modal:", error);
    }
}

/**
 * Abre el modal de detalle de historia y carga su información dinámicamente.
 * @param {number} historiaId - ID de la historia de usuario seleccionada.
 */
async function verDetallesHistoriaKanban(historiaId) {
    console.log("Clic en ver detalles para la historia ID:", historiaId);

    // Asegurar que el HTML exista antes de intentar rellenarlo
    await asegurarModalCargadoDetallesHistoria();

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

    historiaSeleccionadaKanban = historia;

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
async function abrirEvidenciasHistoriaSeleccionada() {
    if (!historiaSeleccionadaKanban) {
        alert("Primero debes seleccionar una historia.");
        return;
    }

    const historiaId =
        historiaSeleccionadaKanban.historia_id ??
        historiaSeleccionadaKanban.id;

    await abrirModalEvidenciasHistoria(historiaId);
}