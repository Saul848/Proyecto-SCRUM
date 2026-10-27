class reunionDAO{
    constructor(pool) {
        this.pool = pool; // Conector con Postgres
    }

    async obtenerHistoriasDeIteracion() {
        const { rows } = await this.pool.query(
            `SELECT id, nombre, valor 
            FROM scrumbird.historia_de_usuario 
            ORDER BY id;`
        );
        return rows;
    }


    async marcarPrioritarias(ids) {
        if (!ids || ids.length === 0) return { rowCount: 0 };
        const { rowCount } = await this.pool.query(
            `UPDATE scrumbird.historia_de_usuario
             SET prioridad = true
             WHERE id = ANY($1::int[]);`,
            [ids]
        );
        return { rowCount };
    }
}

module.exports = reunionDAO;
