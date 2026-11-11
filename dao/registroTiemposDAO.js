class RegistroTiemposDAO {
    constructor(pool) {
        this.pool = pool;
    }

    async crear({ actividad, idUsuario, idProyecto }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.registro_tiempos (hora_inicio, actividad, id_usuario, id_proyecto)
            VALUES (NOW(), $1, $2, $3)
             RETURNING *;`,
            [actividad, idUsuario, idProyecto]
        );
        return rows[0];
    }

    async finalizar(idRegistro, { hecho, pendiente }) {
        const { rows } = await this.pool.query(
            `UPDATE scrumbird.registro_tiempos
            SET hora_final = NOW(),
                tiempo_total = NOW() - hora_inicio,
                hecho = $1,
                pendiente = $2
            WHERE id_registro = $3
             RETURNING *;`,
            [hecho, pendiente, idRegistro]
        );
        return rows[0];
    }

    /**
     * Método para recuperar la lista de registros de tiempos de un usuario especifico.
     * idProyecto es null por defecto, si se introduce con un valor se recuperarán los 
     * registros de tiempos de un usuario en un proyecto especifico
     * @param {*} idUsuario 
     * @param {*} idProyecto 
     * @returns 
     */
    async listarPorUsuario(idUsuario, idProyecto = null) {
        let query = `SELECT * FROM scrumbird.registro_tiempos WHERE id_usuario = $1`;
        const params = [idUsuario];

        if (idProyecto !== null) {
            query += ` AND id_proyecto = $2`;
            params.push(idProyecto);
        }

        query += ` ORDER BY hora_inicio DESC;`;

        const { rows } = await this.pool.query(query, params);
        return rows;
    }
}

module.exports = RegistroTiemposDAO;