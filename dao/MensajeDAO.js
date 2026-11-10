/**
 * @class mensajeDAO
 * @description Capa de acceso a datos para mensajes (privados, canales y grupos) en PostgreSQL.
 */
class MensajeDAO {
    
    constructor(pool) {
        this.pool = pool;
    }

    // ==========================================
    // 1. MENSAJES PRIVADOS (Usuario a Usuario)
    // ==========================================
    async listarMensajesPrivados(idUsuario1, idUsuario2) {
        const query = `
            SELECT id, id_autor, id_usuario_destino, fecha, mensaje, id_canal
            FROM scrumbird.mensaje
            WHERE (id_usuario_destino IS NOT NULL)
            AND ((id_autor = $1 AND id_usuario_destino = $2) OR (id_autor = $2 AND id_usuario_destino = $1))
            ORDER BY fecha ASC;
        `;
        const { rows } = await this.pool.query(query, [idUsuario1, idUsuario2]);
        return rows;
    }

    async crearMensajePrivado({ idAutor, idUsuarioDestino, mensaje }) {
        const query = `
            INSERT INTO scrumbird.mensaje (id_autor, id_usuario_destino, mensaje, fecha)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, id_autor, id_usuario_destino, fecha, mensaje;
        `;
        const { rows } = await this.pool.query(query, [idAutor, idUsuarioDestino, mensaje]);
        return rows[0];
    }

    // ==========================================
    // 2. MENSAJES DE CANALES (Tabla: canal / mensaje)
    // ==========================================
    async listarCanalesPorProyecto(idProyecto) {
        const query = `
            SELECT id, id_proyecto, nombre, descripcion
            FROM scrumbird.canal
            WHERE id_proyecto = $1;
        `;
        const { rows } = await this.pool.query(query, [idProyecto]);
        return rows;
    }

    async listarMensajesCanal(idCanal) {
        const query = `
            SELECT m.id, m.id_autor, m.id_canal, m.fecha, m.mensaje,
                u.nombre as nombre_autor, u.nombre_de_usuario
            FROM scrumbird.mensaje m
            JOIN scrumbird.usuario u ON m.id_autor = u.id
            WHERE m.id_canal = $1
            ORDER BY m.fecha ASC;
        `;
        const { rows } = await this.pool.query(query, [idCanal]);
        return rows;
    }

    async crearMensajeCanal({ idAutor, idCanal, mensaje }) {
        const query = `
            INSERT INTO scrumbird.mensaje (id_autor, id_canal, mensaje, fecha)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, id_autor, id_canal, fecha, mensaje;
        `;
        const { rows } = await this.pool.query(query, [idAutor, idCanal, mensaje]);
        return rows[0];
    }

    // ==========================================
    // 3. MENSAJES DE GRUPO (Tabla: grupo / mensaje_grupo)
    // ==========================================
    async listarGruposPorUsuario(idProyecto, idUsuario) {
        const query = `
            SELECT g.id, g.nombre, g.descripcion, g.id_proyecto
            FROM scrumbird.grupo g
            JOIN scrumbird.esta_en_grupo eg ON g.id = eg.id_grupo
            WHERE g.id_proyecto = $1 AND eg.id_usuario = $2;
        `;
        const { rows } = await this.pool.query(query, [idProyecto, idUsuario]);
        return rows;
    }

    async listarMensajesGrupo(idGrupoDestino) {
        const query = `
            SELECT mg.id, mg.id_autor, mg.id_grupo_destino, mg.fecha, mg.mensaje,
                u.nombre as nombre_autor, u.nombre_de_usuario
            FROM scrumbird.mensaje_grupo mg
            JOIN scrumbird.usuario u ON mg.id_autor = u.id
            WHERE mg.id_grupo_destino = $1
            ORDER BY mg.fecha ASC;
        `;
        const { rows } = await this.pool.query(query, [idGrupoDestino]);
        return rows;
    }

    async crearMensajeGrupo({ idAutor, idGrupoDestino, mensaje }) {
        const query = `
            INSERT INTO scrumbird.mensaje_grupo (id_autor, id_grupo_destino, mensaje, fecha)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, id_autor, id_grupo_destino, fecha, mensaje;
        `;
        const { rows } = await this.pool.query(query, [idAutor, idGrupoDestino, mensaje]);
        return rows[0];
    }
}

module.exports = MensajeDAO;