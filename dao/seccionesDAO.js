class SeccionesDAO {
        constructor(pool) {
        this.pool = pool;
    }

    //Lista TODAS las secciones
    async listar() {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, numero_seccion, numero_paginas, id_modulo FROM secciones;'
        );
        return rows;
    }

    //lista las secciones de un modulo especifico
    async listarSeccionesModulo(id_modulo){
        const { rows } = await this.pool.query(
            'SELECT id, nombre, numero_seccion, numero_paginas, id_modulo FROM secciones;'
        );
        return rows;
    }

    async obtenerPorId(id) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, numero_seccion, numero_paginas, id_modulo FROM secciones WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    }
    
    async obtenerSeccionesDeModulo(id_modulo) {
    const { rows } = await this.pool.query(
        `SELECT
        id,
        nombre,
        numero_seccion,
        numero_paginas,
        id_modulo
        FROM scrumbird.secciones
        WHERE id_modulo = $1
        ORDER BY numero_seccion ASC, id ASC`,
        [id_modulo]
    );

    return rows;
    }
}
module.exports = SeccionesDAO;