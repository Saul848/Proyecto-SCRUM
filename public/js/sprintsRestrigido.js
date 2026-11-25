// =========================================================================
// GESTIÓN DE SPRINTS (MODO CONSULTA / SOLO LECTURA)
// =========================================================================

/**
 * Obtiene la lista de sprints de la base de datos, los ordena por número de sprint
 * y construye las filas sin selección ni botón eliminar, conservando el botón libro.
 * @async
 * @returns {Promise<void>}
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

            filaSprint.innerHTML = `
                <label>${noSprint}</label>
                <label>${objetivo}</label>
                <label><span style="padding: 2px 8px; border-radius: 4px; background: ${estado === 'en progreso' ? '#10b981' : estado === 'terminado' ? '#64748b' : '#3b82f6'}; color: #fff; font-size: 11px;">${estado}</span></label>
                <label>${fechaInicio}</label>
                <label>${fechaFin}</label>
                <div class="div-acciones-sprint" style="display: flex; gap: 6px; justify-content: center;">
                    <button type="button" class="btn-toggle-sprint" title="Ver historias asignadas" onclick="toggleDetalleSprint(${sprintId})" style="background:#0d8bf2; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">📖</button>
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
 * @param {number|string} sprintId - Identificador del sprint.
 * @returns {void}
 */
function toggleDetalleSprint(sprintId) {
    const detalle = document.getElementById(`detalleSprint_${sprintId}`);
    if (detalle) {
        detalle.style.display = detalle.style.display === "none" ? "block" : "none";
    }
}