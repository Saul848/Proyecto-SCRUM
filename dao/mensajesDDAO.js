/**
 * DAO para la gestión de mensajes directos y de grupo en la base de datos.
 * @module mensajesDDAO
 */
class mensajesDDAO {
    constructor(pool) {
        this.pool = pool; 
    }

    /**
     * Obtiene los mensajes de un grupo específico.
     * @param {number} idGrupo 
     * @returns {Promise<Array>}
     */
    async obtenerMensajesGrupo(idGrupo) {
        const { rows } = await this.pool.query(
            `SELECT mg.id, mg.id_autor, mg.id_grupo_destino, mg.fecha, mg.mensaje, u.nombre as autor_nombre
            FROM scrumbird.mensaje_grupo mg
            JOIN scrumbird.usuario u ON mg.id_autor = u.id
            WHERE mg.id_grupo_destino = $1
            ORDER BY mg.fecha ASC;`,
            [idGrupo]
        );
        return rows;
    }

    /**
     * Inserta un nuevo mensaje dirigido a un grupo.
     * @param {Object} datos - { idAutor, idGrupoDestino, mensaje }
     * @returns {Promise<Object>}
     */
    async guardarMensajeGrupo({ idAutor, idGrupoDestino, mensaje }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.mensaje_grupo (id_autor, id_grupo_destino, mensaje) 
             VALUES ($1, $2, $3) RETURNING *;`,
            [idAutor, idGrupoDestino, mensaje]
        );
        return rows[0];
    }
}

module.exports = mensajesDDAO;