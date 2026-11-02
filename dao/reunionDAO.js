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
            `SELECT id, id_proyecto, id_sprint, id_tipo_reunion, nombre, fecha_inicio, fecha_fin, estado 
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
            `SELECT id, no_iteracion, objetivo 
             FROM scrumbird.sprint 
             WHERE id_proyecto = $1 
             ORDER BY no_iteracion ASC;`,
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

    //registrar nueva reunion
    async crearReunion(idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin) {
        const estadoInicial = 'Programada';
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.reunion (id_proyecto, id_sprint, id_tipo_reunion, nombre, fecha_inicio, fecha_fin, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id;`,
            [idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin, estadoInicial]
        );
        return rows[0].id;
    }
}

module.exports = reunionDAO;