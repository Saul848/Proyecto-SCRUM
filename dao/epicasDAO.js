class epicasDAO {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Funcion para obtener las epicas presentes en un proyecto
     * @param {Int} idProyecto id del proyecto de donde se obtendran las epicas 
     * @returns Arreglo de objetos epicas
     */
    async obtenerEpicasEnProyecto(idProyecto) {
        try {
            const query = `SELECT id, nombre, id_proyecto FROM scrumbird.epicas WHERE id_proyecto = $1 ORDER BY id ASC;`;
            const { rows } = await this.pool.query(query, [idProyecto]);
            const data = rows;
            return data;
        } catch (error) {
            console.error("Error en el DAO al obtener las épicas del proyecto:", error);
            throw error;
        }
    }

    /**
     * Funcion que obtiene una epica en especifico
     * @param {Int} idEpica id de la epica
     * @param {Int} idProyecto id del proyecto
     * @returns Objeto epica
     */
    async obtenerEpicaEnProyecto(idEpica, idProyecto) {
        try {
            const query = `SELECT id, nombre, id_proyecto FROM scrumbird.epicas WHERE id = $1 AND id_proyecto = $2;`;
            const { rows } = await this.pool.query(query, [idEpica, idProyecto]);
            const data = rows[0] || null;
            return data;
        } catch (error) {
            console.error("Error en el DAO al obtener la épica en el proyecto:", error);
            throw error;
        }
    }

    /**
     * Funcion para agregar una epica
     * @param {int} param nombre y id del proyecto
     * @returns Respuesta
     */
    async agregarEpica({ nombre, idProyecto }) {
        try {
            const query = `INSERT INTO scrumbird.epicas (nombre, id_proyecto) VALUES ($1, $2) RETURNING id, nombre, id_proyecto;`;
            const { rows } = await this.pool.query(query, [nombre, idProyecto]);
            return { ok: true, mensaje: "Épica agregada correctamente", data: rows[0] };
        } catch (error) {
            console.error("Error en el DAO al agregar una épica:", error);
            throw error;
        }
    }

    /**
     * Funcion para eliminar una epica
     * @param {Int} idEpica id de la epica
     * @param {Int} idProyecto id del proyecto
     * @returns respuesta
     */
    async eliminarEpica(idEpica, idProyecto) {
        try {
            const query = `DELETE FROM scrumbird.epicas WHERE id = $1 AND id_proyecto = $2;`;
            const resultado = await this.pool.query(query, [idEpica, idProyecto]);
            if (resultado.rowCount > 0) {
                return { ok: true, eliminado: true, mensaje: "Épica eliminada correctamente" };
            }
            return { ok: false, eliminado: false, mensaje: "No se encontró la épica para eliminar" };
        } catch (error) {
            console.error("Error en el DAO al eliminar la épica:", error);
            throw error;
        }
    }

    /**
     * Funcion para modificar una epica
     * @param {Int} idEpica id de la epica
     * @param {Int} idProyecto id del proyecto
     * @param {Int} param2 Nombre de la epica
     * @returns 
     */
    async modificarEpica(idEpica, idProyecto, { nombre }) {
        try {
            const query = `UPDATE scrumbird.epicas SET nombre = $1 WHERE id = $2 AND id_proyecto = $3 RETURNING id, nombre, id_proyecto;`;
            const resultado = await this.pool.query(query, [nombre, idEpica, idProyecto]);
            if (resultado.rowCount > 0) {
                return { ok: true, mensaje: "Épica modificada correctamente", data: resultado.rows[0] };
            }
            return { ok: false, mensaje: "No se encontró la épica para modificar" };
        } catch (error) {
            console.error("Error en el DAO al modificar la épica:", error);
            throw error;
        }
    }

    /**
     * Verifica si ya existe una épica con el mismo nombre en el proyecto
     * @param {string} nombre
     * @param {number} idProyecto
     * @param {number|null} excluirIdEpica - ID a excluir al modificar
     * @returns {Promise<boolean>}
     */
    async existeEpicaConNombreEnProyecto(nombre, idProyecto, excluirIdEpica = null) {
        try {
            let query = `
                SELECT id
                FROM scrumbird.epicas
                WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
                AND id_proyecto = $2
            `;
            const params = [nombre, idProyecto];

            if (excluirIdEpica !== null) {
                query += ` AND id <> $3`;
                params.push(excluirIdEpica);
            }

            query += ` LIMIT 1;`;
            const { rows } = await this.pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error("Error en el DAO al validar épica duplicada:", error);
            throw error;
        }
    }
}

module.exports = epicasDAO;