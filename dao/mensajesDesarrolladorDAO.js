const pool = require('../poolDb');

/**
 * Clase DAO para gestionar las consultas a la base de datos relacionadas con los mensajes del desarrollador.
 * @class MensajeDesarrolladorDAO
 */
class MensajeDesarrolladorDAO {
    
    /**
     * Obtiene todos los mensajes pertenecientes a un canal específico de forma cronológica.
     * 
     * @async
     * @static
     * @param {number} idCanal - ID del canal de comunicación.
     * @returns {Promise<Object[]>} Arreglo de objetos con los datos de los mensajes.
     */
    static async obtenerPorCanal(idCanal) {
        const consulta = `
        SELECT 
            m.id,
            m.id_autor AS id_usuario,
            m.mensaje AS contenido,
            m.fecha AS fecha_envio,
            u.nombre AS nombre_usuario,
            u.nombre_de_usuario AS username
        FROM scrumbird.mensaje m
        JOIN scrumbird.usuario u ON m.id_autor = u.id
        WHERE m.id_canal = $1
        ORDER BY m.fecha ASC;
        `;
        const { rows } = await pool.query(consulta, [idCanal]);
        return rows;
    }

    /**
     * Inserta un nuevo mensaje enviado por un desarrollador en un canal.
     * 
     * @async
     * @static
     * @param {number} idCanal - ID del canal donde se publica el mensaje.
     * @param {number} idUsuario - ID del desarrollador autor del mensaje.
     * @param {string} contenido - Texto del mensaje.
     * @returns {Promise<Object>} El objeto del mensaje guardado junto con datos del usuario.
     */
    static async guardar(idCanal, idUsuario, contenido) {
        const consulta = `
        INSERT INTO scrumbird.mensaje (id_canal, id_autor, mensaje, fecha)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, id_canal, id_autor AS id_usuario, mensaje AS contenido, fecha AS fecha_envio;
        `;
        const { rows } = await pool.query(consulta, [idCanal, idUsuario, contenido]);
        
        const usuarioRes = await pool.query(
        'SELECT nombre, nombre_de_usuario FROM scrumbird.usuario WHERE id = $1;',
        [idUsuario]
        );

        return {
        ...rows[0],
        nombre_usuario: usuarioRes.rows[0]?.nombre || 'Desarrollador',
        username: usuarioRes.rows[0]?.nombre_de_usuario || ''
        };
    }

    /**
     * Obtiene los mensajes privados directos entre dos usuarios (ej. Desarrollador y Facilitador).
     * 
     * @async
     * @static
     * @param {number} idUsuarioActual - ID del usuario autenticado.
     * @param {number} idDestino - ID del usuario receptor.
     * @returns {Promise<Object[]>} Arreglo de mensajes directos.
     */
    static async obtenerMensajesDirectos(idUsuarioActual, idDestino) {
        const consulta = `
        SELECT 
            m.id,
            m.id_autor,
            m.id_usuario_destino,
            m.mensaje AS contenido,
            m.fecha AS fecha_envio,
            u.nombre AS nombre_usuario,
            u.nombre_de_usuario AS username
        FROM scrumbird.mensaje m
        JOIN scrumbird.usuario u ON m.id_autor = u.id
        WHERE (m.id_autor = $1 AND m.id_usuario_destino = $2)
            OR (m.id_autor = $2 AND m.id_usuario_destino = $1)
        ORDER BY m.fecha ASC;
        `;
        const { rows } = await pool.query(consulta, [idUsuarioActual, idDestino]);
        return rows;
    }

    /**
     * Guarda un mensaje privado directo en la base de datos.
     * 
     * @async
     * @static
     * @param {number} idAutor - ID del usuario que redacta el mensaje.
     * @param {number} idUsuarioDestino - ID del usuario destinatario.
     * @param {string} contenido - Contenido del mensaje directo.
     * @returns {Promise<Object>} El objeto del mensaje directo guardado.
     */
    static async guardarMensajeDirecto(idAutor, idUsuarioDestino, contenido) {
        const consulta = `
        INSERT INTO scrumbird.mensaje (id_autor, id_usuario_destino, mensaje, fecha, id_canal)
        VALUES ($1, $2, $3, NOW(), NULL)
        RETURNING id, id_autor, id_usuario_destino, mensaje AS contenido, fecha AS fecha_envio;
        `;
        const { rows } = await pool.query(consulta, [idAutor, idUsuarioDestino, contenido]);
        
        const usuarioRes = await pool.query(
        'SELECT nombre, nombre_de_usuario FROM scrumbird.usuario WHERE id = $1;',
        [idAutor]
        );

        return {
        ...rows[0],
        nombre_usuario: usuarioRes.rows[0]?.nombre || 'Desarrollador',
        username: usuarioRes.rows[0]?.nombre_de_usuario || ''
        };
    }
    }

module.exports = MensajeDesarrolladorDAO;