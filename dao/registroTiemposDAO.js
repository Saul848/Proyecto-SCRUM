class RegistroTiemposDAO {
    constructor(pool) {
        this.pool = pool;
    }

    async crear({ actividad, idUsuario }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.registro_tiempos (hora_inicio, actividad, id_usuario)
            VALUES (NOW(), $1, $2)
             RETURNING *;`,
            [actividad, idUsuario]
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

    async listarPorUsuario(idUsuario) {
        const { rows } = await this.pool.query(
            `SELECT * FROM scrumbird.registro_tiempos
            WHERE id_usuario = $1
            ORDER BY hora_inicio DESC;`,
            [idUsuario]
        );
        return rows;
    }
}

module.exports = RegistroTiemposDAO;