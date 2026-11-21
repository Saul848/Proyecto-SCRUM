// seccionesDao.js
class SeccionesDAO {
  constructor(pool) {
    this.pool = pool;
  }

  async listar() {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, numero_seccion, numero_paginas, id_modulo
       FROM scrumbird.secciones
       ORDER BY id_modulo ASC, numero_seccion ASC, id ASC`
    );
    return rows;
  }

  async listarSeccionesModulo(id_modulo) {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, numero_seccion, numero_paginas, id_modulo
       FROM scrumbird.secciones
       WHERE id_modulo = $1
       ORDER BY numero_seccion ASC, id ASC`,
      [id_modulo]
    );
    return rows;
  }

  async obtenerPorId(id) {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, numero_seccion, numero_paginas, id_modulo
       FROM scrumbird.secciones
       WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async obtenerSeccionesDeModulo(id_modulo) {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, numero_seccion, numero_paginas, id_modulo
       FROM scrumbird.secciones
       WHERE id_modulo = $1
       ORDER BY numero_seccion ASC, id ASC`,
      [id_modulo]
    );
    return rows;
  }
}

module.exports = SeccionesDAO;