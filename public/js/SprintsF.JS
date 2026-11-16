//Modales Agregar y Modificar
const modalAgregarSprint = document.getElementById("modalAgregarSprint");
const modalModificarSprint = document.getElementById("modalModificarSprint");

//Botones de apertura de modales
const btnAgregarSprint = document.getElementById("btnAgregarSprint");
const btnModificarSprint = document.getElementById("btnModSprint");

// Listener para el botón "+ Añadir nueva historia"
btnAgregarSprint.addEventListener("click", function () {
    modalAgregarSprint.classList.add('activo');// Muestra el modal
});

// Listener para el botón "# Modificar historia"
btnModificarSprint.addEventListener("click", function () {
    modalModificarSprint.classList.add('activo');// Muestra el modal
});

/**
 * Función para renderizar dinámicamente las historias de usuario en el DOM
 */
async function renderizarSprints() {
    // 1. Solicitamos los datos al servidor y los guardamos en la variable
    datosHistorias = await obtenerHistorias(parseInt(1,10));
    console.log("Datos recibidos del servidor:", datosHistorias); // <-- Revisa la consola del navegador (F12)

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

        // Obtenemos los criterios de la historia o colocamos un mensaje por defecto si está vacío
        const criterios = historia.criterios && historia.criterios.length > 0 
            ? historia.criterios 
            : [{ criterio: "Sin criterios de aceptación" }];

        let criteriosTextAreasHTML = "";
        criterios.forEach((crit, index) => {
            const claseActiva = index === 0 ? "active" : "";
            // Usamos un textarea con la clase específica y readonly para visualización en tabla
            criteriosTextAreasHTML += `<textarea class="criterio-input-fila ${claseActiva}" readonly placeholder="Criterio...">${crit.criterio || ""}</textarea>`;
        });

        filaHtml.innerHTML = `
            <label class="LabelID">${historia.numeroDeHistoria || "#"}</label>
            <label class="LabelNombreHistoria">${historia.nombre || historia.titulo}</label>
            <label class="LabelDescripccion">${historia.descripcion || "#"}</label>
            
            <!-- Contenedor con botones laterales para los Criterios de Aceptación -->
            <div class="criterio-fila-wrapper" data-index="0">
                <button type="button" class="btn-fila-lateral btn-fila-izq" onclick="cambiarCriterioFila(${historia.id}, -1)" title="Anterior">◀</button>
                <div class="criterios-fila-columna" id="criteriosContainer_${historia.id}">
                    ${criteriosTextAreasHTML}
                </div>
                <button type="button" class="btn-fila-lateral btn-fila-der" onclick="cambiarCriterioFila(${historia.id}, 1)" title="Siguiente">▶</button>
            </div>

            <label class="LabelValor">${historia.valor || "#"}</label>
            <label class="LabelValor">${historia.horas || "#"}</label>
            <label class="LabelSprintAsignado">${historia.sprint || historia.sprintAsig || historia.asignado_al_sprint || "#"}</label>
            
            <div class="DivBtnEliminar">
                <button class="btnEliminarHistoria" title="Eliminar" data-id="${historia.id}" onclick="eliminarHistoriaUsuario(${historia.id}, ${parseInt(1,10)})">🗑️</button>
            </div>
        `;
        divHistoria.appendChild(filaHtml);
    });
}
