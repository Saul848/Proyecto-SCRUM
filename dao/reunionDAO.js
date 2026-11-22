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
}

module.exports = reunionDAO;