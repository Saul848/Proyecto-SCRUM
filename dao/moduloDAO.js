class ModuloDAO {
        constructor(pool) {
        this.pool = pool;
    }
    
    async listar() {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, numero_modulo, numero_secciones, objetivo FROM modulos;'
        );
        return rows;
    }

    async obtenerPorId(id) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, numero_modulo, numero_secciones, objetivo FROM modulos WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = ModuloDAO;