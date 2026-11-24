class reunionDAO{
    constructor(pool) {
        this.pool = pool; // Conector con Postgres
    }

    //cambia estado a 'En curso'
    async iniciarReunion(idReunion) {
        const { rowCount } = await this.pool.query(
            `UPDATE scrumbird.reunion 
             SET estado = 'En curso' 
             WHERE id = $1;`,
            [idReunion]
        );
        return rowCount;
    }

    //listar reuniones por proyecto
    async obtenerReunionesPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT id, id_proyecto, 
            id_sprint, id_tipo_reunion, 
            nombre, fecha_inicio, fecha_fin, estado 
             FROM scrumbird.reunion 
             WHERE id_proyecto = $1 
             ORDER BY fecha_inicio DESC;`,
            [idProyecto]
        );
        return rows;
    }

    //obtener los sprints de un proyecto
    async obtenerSprintsPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT DISTINCT asignado_al_sprint AS id, 
                    asignado_al_sprint AS no_iteracion, 
                    CONCAT('Sprint ', asignado_al_sprint) AS objetivo
            FROM scrumbird.historia_de_usuario
            WHERE id_proyecto = $1 AND asignado_al_sprint IS NOT NULL
            ORDER BY asignado_al_sprint ASC;`,
            [idProyecto]
        );
        return rows;
    }

    //participantes vinculados al proyecto 
    async obtenerParticipantesPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT u.id, u.nombre, u.correo_electronico, tp.rol 
             FROM scrumbird.trabajando_en_proyecto tp
             JOIN scrumbird.usuario u ON tp.id_usuario = u.id
             WHERE tp.id_proyecto = $1;`,
            [idProyecto]
        );
        return rows;
    }

    async obtenerTiposReunion() {
        const { rows } = await this.pool.query(
            `SELECT id, nombre 
            FROM scrumbird.tipo_reunion 
            ORDER BY id ASC;`
        );
        return rows;
    }

    //registrar nueva reunion
    async crearReunion(idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin) {
        const estadoInicial = 'Programada';
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.reunion (id_proyecto, 
            id_sprint, id_tipo_reunion, nombre, fecha_inicio, 
            fecha_fin, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id;`,
            [idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin, estadoInicial]
        );
        return rows[0].id;
    }

    // En reunionDAO.js
    async eliminarReunion(idReunion) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `DELETE FROM scrumbird.reunion_participante
                WHERE id_reunion = $1::integer;`,
                [idReunion]
            );
            const { rowCount } = await client.query(
                `DELETE FROM scrumbird.reunion
                WHERE id = $1::integer;`,
                [idReunion]
            );
            await client.query('COMMIT');
            return rowCount;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async obtenerHistoriasPorSprint(idSprint) {
        const { rows } = await this.pool.query(
            `SELECT id, 
                    numero_de_historia AS "numeroDeHistoria", 
                    nombre, 
                    descripcion, 
                    valor, 
                    horas_estimadas, 
                    factor_de_complejidad, 
                    horas_calculadas,
                    asignado_al_sprint AS id_sprint 
             FROM scrumbird.historia_de_usuario 
             WHERE asignado_al_sprint = $1::integer
             ORDER BY numero_de_historia ASC;`,
            [idSprint]
        );
        return rows;
    }

    async finalizarReunion(idReunion) {
        const { rowCount } = await this.pool.query(
            `UPDATE scrumbird.reunion 
            SET estado = 'Finalizada' 
            WHERE id = $1;`,
            [idReunion]
        );
        return rowCount;
    }

    //funciones para la reunión de revisión

    //verifica que haya una reunión de planificación terminada del sprint
    async verificarPlanningConcluido(idSprint) {
        const { rows } = await this.pool.query(
            `SELECT COUNT(*) AS total 
            FROM scrumbird.reunion 
            WHERE id_sprint = $1 
            AND id_tipo_reunion = 2 
            AND estado = 'Finalizada';`,
            [idSprint]
        );
        return Number(rows[0].total) > 0;
    }
    
    //se obtienen las funciones que fueron terminadas en el sprint
    async obtenerHistoriasRevisionPorSprint(idSprint, idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT h.id, 
                    h.numero_de_historia AS "numeroDeHistoria", 
                    h.nombre, 
                    h.descripcion, 
                    h.valor, 
                    h.horas_estimadas, 
                    h.factor_de_complejidad, 
                    h.asignado_al_sprint AS id_sprint,
                    COALESCE(
                        (SELECT json_agg(json_build_object('id', c.id, 'descripcion', c.criterios_de_aceptacion))
                         FROM scrumbird.criterios_de_aceptacion c 
                         WHERE c.id_historia = h.id), 
                        '[]'::json
                    ) AS criterios
            FROM scrumbird.historia_de_usuario h
            WHERE h.asignado_al_sprint = $1::integer
              AND ($2::integer IS NULL OR h.id_proyecto = $2::integer)
            ORDER BY h.numero_de_historia ASC;`,
            [idSprint, idProyecto || null]
        );
        return rows;
    }

    //añade el comentario del cliente
    async actualizarRevisionHistoria(idHistoria, estadoRevision, comentario, idEmisor, idReunion, idProyecto) {
        if (comentario && comentario.trim() !== '') {
            await this.pool.query(
                `INSERT INTO scrumbird.comentario (emisor, id_historia, fecha_ultima_modificacion, contenido, id_proyecto)
                 VALUES ($1, $2, NOW(), $3, $4);`,
                [idEmisor, idHistoria, comentario, idProyecto]
            );
        }
    }

    async devolverHistoriaAProductBacklog(idHistoria) {
    //marcamos la historia como pendiente y desvinculamos del sprint asginado
    const { rowCount } = await this.pool.query(
        `UPDATE scrumbird.historia_de_usuario
         SET pendiente = true,
             asignado_al_sprint = NULL
         WHERE id = $1;`,
        [idHistoria]
    );
    return rowCount;
    }

    //funciones para la daily scrum
    
    //respuestas publicadas de todos los participantes de esa reunión
    async obtenerDaily(idReunion) {
        const { rows: reu } = await this.pool.query(
            `SELECT id, id_proyecto, id_sprint, estado,
                    to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha
             FROM scrumbird.reunion
             WHERE id = $1::integer AND id_tipo_reunion = 1;`,
            [idReunion]
        );
        if (reu.length === 0) return null;
        const r = reu[0];

        const { rows: filas } = await this.pool.query(
            `SELECT rp.id_usuario AS "idUsuario", u.nombre AS autor, tp.rol, rp.anotaciones
             FROM scrumbird.reunion_participante rp
             JOIN scrumbird.usuario u ON u.id = rp.id_usuario
             LEFT JOIN scrumbird.trabajando_en_proyecto tp
                    ON tp.id_usuario = rp.id_usuario AND tp.id_proyecto = $2::integer
             WHERE rp.id_reunion = $1::integer
               AND rp.anotaciones IS NOT NULL AND rp.anotaciones <> '';`,
            [idReunion, r.id_proyecto]
        );

        const respuestas = filas
            .map(f => {
                try {
                    return { idUsuario: f.idUsuario, autor: f.autor, rol: f.rol, ...JSON.parse(f.anotaciones) };
                } catch (e) {
                    return null; //anotación que no pertenece a la daily
                }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.publicadoEn) - new Date(b.publicadoEn));

        const { rows: devs } = await this.pool.query(
            `SELECT COUNT(*) AS total
             FROM scrumbird.trabajando_en_proyecto
             WHERE id_proyecto = $1::integer AND LOWER(rol) = 'desarrollador';`,
            [r.id_proyecto]
        );

        const { rows: historial } = await this.pool.query(
            `SELECT id, to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha
             FROM scrumbird.reunion
             WHERE id_sprint = $1::integer AND id_tipo_reunion = 1
             ORDER BY fecha_inicio ASC, id ASC;`,
            [r.id_sprint]
        );

        return {
            reunion: { id: r.id, fecha: r.fecha, estado: r.estado, idSprint: r.id_sprint },
            respuestas,
            totalDesarrolladores: Number(devs[0].total),
            historial
        };
    }

    //guarda la respuesta; si hay impedimento, también lo registra en la tabla impedimento
    async guardarRespuestaDaily(idReunion, idUsuario, { ayer, hoy, tieneImpedimento, impedimento, idHistoria }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: reu } = await client.query(
                `SELECT id_proyecto, id_sprint, estado FROM scrumbird.reunion
                 WHERE id = $1::integer AND id_tipo_reunion = 1;`,
                [idReunion]
            );
            if (reu.length === 0) throw new Error('Reunión no encontrada');
            if (String(reu[0].estado).toLowerCase() === 'finalizada') {
                throw new Error('La daily ya fue finalizada');
            }

            const anotaciones = JSON.stringify({
                ayer, hoy, tieneImpedimento, impedimento,
                idHistoria: idHistoria || null,
                publicadoEn: new Date().toISOString()
            });

            //UPDATE y luego INSERT: no depende de que exista una constraint única
            const upd = await client.query(
                `UPDATE scrumbird.reunion_participante
                 SET anotaciones = $3
                 WHERE id_reunion = $1::integer AND id_usuario = $2::integer;`,
                [idReunion, idUsuario, anotaciones]
            );
            if (upd.rowCount === 0) {
                await client.query(
                    `INSERT INTO scrumbird.reunion_participante (id_reunion, id_usuario, anotaciones)
                     VALUES ($1, $2, $3);`,
                    [idReunion, idUsuario, anotaciones]
                );
            }

            //estado en minúscula, igual que impedimentoDAO ('pendiente')
            if (tieneImpedimento) {
                await client.query(
                    `INSERT INTO scrumbird.impedimento
                        (id_proyecto, id_sprint, id_historia, id_usuario_reporta, descripcion, estado)
                     SELECT $1::int, $2::int, $3::int, $4::int, $5::text, 'pendiente'
                     WHERE NOT EXISTS (
                        SELECT 1 FROM scrumbird.impedimento
                        WHERE id_sprint = $2::int AND id_historia = $3::int
                          AND id_usuario_reporta = $4::int AND descripcion = $5::text
                     );`,
                    [reu[0].id_proyecto, reu[0].id_sprint, idHistoria, idUsuario, impedimento]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = reunionDAO;