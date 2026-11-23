const fs = require('fs');
const path = require('path');

// El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class sprintsDAO {
    constructor(pool) {
        this.pool = pool; // Pool de conexiones con PostgreSQL
    }

    /**
     * Obtiene una lista de objetos Sprints con sus historias asignadas, criterios de aceptación 
     * y el número de iteración formateado para el campo SprintAsignado.
     * @param {number} idProyecto 
     * @returns {Promise<Array>} Arreglo de sprints estructurado
     */
    async obtenerSprints(idProyecto) {
        const query = `
            SELECT 
                s.id AS sprint_id,
                s.no_iteracion,
                s.objetivo,
                s.estado AS sprint_estado,
                s.fecha_inicio,
                s.fecha_fin,
                h.id AS historia_id,
                h.numero_de_historia,
                h.nombre AS historia_nombre,
                h.descripcion AS historia_descripcion,
                h.valor,
                COALESCE(h.horas_estimadas, 0) AS horas_estimadas,
                s_asignado.no_iteracion AS sprint_asignado_num,
                ca.id AS id_criterio,
                ca.numero_de_criterio,
                ca.criterios_de_aceptacion
            FROM scrumbird.sprint s
            LEFT JOIN scrumbird.historia_de_usuario h 
                ON s.id = h.asignado_al_sprint AND h.id_proyecto = s.id_proyecto
            LEFT JOIN scrumbird.sprint s_asignado
                ON h.asignado_al_sprint = s_asignado.id
            LEFT JOIN scrumbird.criterios_de_aceptacion ca 
                ON h.id = ca.id_historia AND h.id_proyecto = ca.id_proyecto
            WHERE s.id_proyecto = $1
            ORDER BY s.no_iteracion ASC, h.id ASC, ca.id ASC;
        `;

        try {
            const { rows } = await this.pool.query(query, [idProyecto]);

            const mapSprints = rows.reduce((acc, row) => {
                if (!acc[row.sprint_id]) {
                    acc[row.sprint_id] = {
                        Id: row.sprint_id,
                        NoSprint: row.no_iteracion,
                        objetivo: row.objetivo || "",
                        estado: row.sprint_estado || "planeado",
                        fechaInicio: row.fecha_inicio ? row.fecha_inicio.toISOString().slice(0, 10) : "",
                        fechaFin: row.fecha_fin ? row.fecha_fin.toISOString().slice(0, 10) : "",
                        historiasAsignadas: []
                    };
                }

                if (row.historia_id) {
                    let historia = acc[row.sprint_id].historiasAsignadas.find(h => h.ID === row.historia_id);
                    if (!historia) {
                        historia = {
                            ID: row.historia_id,
                            NoHistoria: row.numero_de_historia || row.historia_id,
                            nombre: row.historia_nombre || "",
                            Descripccion: row.historia_descripcion || "",
                            criteriosAceptacion: [],
                            Valor: row.valor || 0,
                            horasEstimadas: row.horas_estimadas || 0,
                            SprintAsignado: row.sprint_asignado_num ? `Sprint ${row.sprint_asignado_num}` : "Sin asignar"
                        };
                        acc[row.sprint_id].historiasAsignadas.push(historia);
                    }

                    if (row.id_criterio !== null) {
                        if (!historia.criteriosAceptacion.some(c => c.Id === row.id_criterio)) {
                            const numCriterio = historia.criteriosAceptacion.length + 1;
                            historia.criteriosAceptacion.push({
                                Id: row.id_criterio,
                                numero: row.numero_de_criterio || numCriterio,
                                criterio: row.criterios_de_aceptacion
                            });
                        }
                    }
                }

                return acc;
            }, {});

            return Object.values(mapSprints);
        } catch (error) {
            console.error("Error al obtener los sprints con sus historias:", error);
            throw error;
        }
    }

    /**
     * Transacción para agregar un nuevo sprint y vincular las historias de usuario seleccionadas
     * @param {Object} datosSprint { no_iteracion, objetivo, estado, fecha_inicio, fecha_fin, idProyecto, historias }
     * @returns {Promise<Object>} Respuesta con estado ok y data
     */
    async agregarSprint({ no_iteracion, objetivo, estado = 'planeado', fecha_inicio, fecha_fin, idProyecto, historias }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const querySprint = `
                INSERT INTO scrumbird.sprint (no_iteracion, objetivo, estado, fecha_inicio, fecha_fin, id_proyecto)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `;
            const resultadoSprint = await client.query(querySprint, [no_iteracion, objetivo, estado, fecha_inicio, fecha_fin, idProyecto]);
            const idSprintGenerado = resultadoSprint.rows[0].id;

            if (historias && Array.isArray(historias) && historias.length > 0) {
                const queryActualizarHistorias = `
                    UPDATE scrumbird.historia_de_usuario
                    SET asignado_al_sprint = $1
                    WHERE id = ANY($2::int[]) AND id_proyecto = $3;
                `;
                await client.query(queryActualizarHistorias, [idSprintGenerado, historias, idProyecto]);
            }

            await client.query('COMMIT');
            return {
                ok: true,
                mensaje: "Sprint agregado correctamente",
                data: { id: idSprintGenerado, no_iteracion, objetivo, estado }
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error en transacción al agregar sprint:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Transacción para modificar un sprint existente y actualizar la asignación de historias
     * @param {number} idSprint 
     * @param {number} idProyecto 
     * @param {Object} datos 
     * @returns {Promise<Object>} Respuesta con estado ok
     */
    async modificarSprint(idSprint, idProyecto, { no_iteracion, objetivo, estado, fecha_inicio, fecha_fin, historias }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const querySprint = `
                UPDATE scrumbird.sprint
                SET no_iteracion = $1, objetivo = $2, estado = $3, fecha_inicio = $4, fecha_fin = $5
                WHERE id = $6 AND id_proyecto = $7;
            `;
            const resultado = await client.query(querySprint, [no_iteracion, objetivo, estado, fecha_inicio, fecha_fin, idSprint, idProyecto]);

            if (resultado.rowCount === 0) {
                await client.query('ROLLBACK');
                return {
                    ok: false,
                    mensaje: "No se encontró el sprint para modificar"
                };
            }

            // Liberar las historias que ya no están asociadas a este sprint
            await client.query(
                `UPDATE scrumbird.historia_de_usuario SET asignado_al_sprint = NULL WHERE asignado_al_sprint = $1 AND id_proyecto = $2;`,
                [idSprint, idProyecto]
            );

            // Asignar las nuevas historias seleccionadas
            if (historias && Array.isArray(historias) && historias.length > 0) {
                await client.query(
                    `UPDATE scrumbird.historia_de_usuario SET asignado_al_sprint = $1 WHERE id = ANY($2::int[]) AND id_proyecto = $3;`,
                    [idSprint, historias, idProyecto]
                );
            }

            await client.query('COMMIT');
            return {
                ok: true,
                mensaje: "Sprint modificado correctamente"
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error en transacción al modificar sprint:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Elimina un sprint de la base de datos
     * @param {number} idSprint 
     * @param {number} idProyecto 
     * @returns {Promise<Object>} Respuesta con estado ok
     */
    async eliminarSprint(idSprint, idProyecto) {
        try {
            const resultado = await this.pool.query(
                'DELETE FROM scrumbird.sprint WHERE id = $1 AND id_proyecto = $2;',
                [idSprint, idProyecto]
            );
            if (resultado.rowCount > 0) {
                return {
                    ok: true,
                    mensaje: "Sprint eliminado correctamente"
                };
            }
            return {
                ok: false,
                mensaje: "El sprint no existe en la BD"
            };
        } catch (error) {
            console.error("Error al eliminar sprint:", error);
            throw error;
        }
    }

    /**
     * Obtiene un sprint específico por su ID y proyecto
     */
    async obtenerSprintPorId(idSprint, idProyecto) {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.sprint WHERE id = $1 AND id_proyecto = $2;',
            [idSprint, idProyecto]
        );
        return rows[0] || null;
    }
    async cerrarSprint(idSprint, idProyecto) {
    const client = await this.pool.connect();

    try {
        await client.query("BEGIN");

        // Mismo bloqueo utilizado al actualizar historias.
        await client.query(
            `SELECT id FROM scrumbird.proyecto
             WHERE id = $1 FOR UPDATE`,
            [idProyecto]
        );

        const sprint = await client.query(
            `SELECT id, estado
             FROM scrumbird.sprint
             WHERE id = $1 AND id_proyecto = $2
             FOR UPDATE`,
            [idSprint, idProyecto]
        );

        if (!sprint.rows.length) {
            const error = new Error("No se encontró el sprint.");
            error.status = 404;
            throw error;
        }

        const cierreExistente = await client.query(
            `SELECT id_sprint
             FROM scrumbird.burndown_cierre
             WHERE id_sprint = $1`,
            [idSprint]
        );

        if (
            sprint.rows[0].estado === "terminado" ||
            cierreExistente.rows.length > 0
        ) {
            const error = new Error(
                "El sprint ya está terminado o tiene un cierre registrado."
            );
            error.status = 409;
            throw error;
        }

        // Una historia está terminada si todas sus asignaciones lo están.
        const medicion = await client.query(
            `WITH historias AS (
                SELECT
                    h.*,
                    (
                        EXISTS (
                            SELECT 1
                            FROM scrumbird.trabajando_en_historia t
                            WHERE t.historia_asignada = h.id
                              AND t.id_proyecto = h.id_proyecto
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM scrumbird.trabajando_en_historia t
                            WHERE t.historia_asignada = h.id
                              AND t.id_proyecto = h.id_proyecto
                              AND t.estado IS DISTINCT FROM 'terminado'
                        )
                    ) AS terminada
                FROM scrumbird.historia_de_usuario h
                WHERE h.id_proyecto = $2
            )
            INSERT INTO scrumbird.burndown_cierre (
                id_sprint,
                horas_restantes,
                puntos_restantes,
                historias_terminadas,
                es_prueba
            )
            SELECT
                $1,
                COALESCE(SUM(horas_calculadas)
                    FILTER (WHERE NOT terminada), 0),
                COALESCE(SUM(puntos_de_historia)
                    FILTER (WHERE NOT terminada), 0),
                COUNT(*) FILTER (
                    WHERE terminada AND asignado_al_sprint = $1
                )::integer,
                false
            FROM historias
            RETURNING *`,
            [idSprint, idProyecto]
        );

        await client.query(
            `UPDATE scrumbird.sprint
             SET estado = 'terminado'
             WHERE id = $1 AND id_proyecto = $2`,
            [idSprint, idProyecto]
        );

        await client.query("COMMIT");

        return {
            ok: true,
            mensaje: "Sprint cerrado y medición registrada.",
            data: medicion.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
}

module.exports = sprintsDAO;