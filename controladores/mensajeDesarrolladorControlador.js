const MensajeDesarrolladorDAO = require('../dao/MensajeDesarrolladorDAO');

/**
 * Controlador para manejar las peticiones HTTP relativas a los mensajes del desarrollador.
 * @class MensajeDesarrolladorControlador
 */
class MensajeDesarrolladorControlador {
    
    /**
     * Obtiene y responde con la lista de mensajes de un canal dado.
     * 
     * @async
     * @static
     * @param {import('express').Request} req - Objeto de solicitud HTTP.
     * @param {import('express').Response} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>}
     */
    static async obtenerMensajes(req, res) {
        try {
        const { idCanal } = req.params;
        const mensajes = await MensajeDesarrolladorDAO.obtenerPorCanal(idCanal);
        res.json({ ok: true, data: mensajes });
        } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al obtener mensajes' });
        }
    }

    /**
     * Guarda un nuevo mensaje enviado a través de un canal.
     * 
     * @async
     * @static
     * @param {import('express').Request} req - Objeto de solicitud HTTP que incluye idCanal, idUsuario y contenido en el body.
     * @param {import('express').Response} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>}
     */
    static async enviarMensaje(req, res) {
        try {
        const { idCanal, idUsuario, contenido } = req.body;
        const nuevoMensaje = await MensajeDesarrolladorDAO.guardar(idCanal, idUsuario, contenido);
        res.status(201).json({ ok: true, data: nuevoMensaje });
        } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al enviar mensaje' });
        }
    }

    /**
     * Obtiene y responde con la conversación de mensajes directos entre dos usuarios.
     * 
     * @async
     * @static
     * @param {import('express').Request} req - Objeto de solicitud HTTP que contiene idUsuario e idDestino en los parámetros.
     * @param {import('express').Response} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>}
     */
    static async obtenerMensajesDirectos(req, res) {
        try {
        const { idUsuario, idDestino } = req.params;
        const mensajes = await MensajeDesarrolladorDAO.obtenerMensajesDirectos(idUsuario, idDestino);
        res.json({ ok: true, data: mensajes });
        } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al obtener mensajes directos' });
        }
    }

    /**
     * Guarda y procesa un nuevo mensaje directo enviado de usuario a usuario.
     * 
     * @async
     * @static
     * @param {import('express').Request} req - Objeto de solicitud HTTP que incluye idAutor, idUsuarioDestino y contenido en el body.
     * @param {import('express').Response} res - Objeto de respuesta HTTP.
     * @returns {Promise<void>}
     */
    static async guardarMensajeDirecto(req, res) {
        try {
        const { idAutor, idUsuarioDestino, contenido } = req.body;
        const mensajeGuardado = await MensajeDesarrolladorDAO.guardarMensajeDirecto(idAutor, idUsuarioDestino, contenido);
        res.json({ ok: true, data: mensajeGuardado });
        } catch (error) {
        res.status(500).json({ ok: false, error: 'Error al enviar mensaje directo' });
        }
    }
}

module.exports = MensajeDesarrolladorControlador;