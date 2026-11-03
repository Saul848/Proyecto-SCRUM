/**
 * Controlador de Mensajes: procesa las solicitudes HTTP para el chat.
 * @module mensajesDControlador
 */
class mensajesDControlador {
    constructor(mensajesDAO) {
        this.dao = mensajesDAO;
    }

    /**
     * GET /mensajes/grupo/:idGrupo
     */
    async listarMensajesGrupo(req, res) {
        const { idGrupo } = req.params;
        try {
            const mensajes = await this.dao.obtenerMensajesGrupo(idGrupo);
            res.json({ ok: true, data: mensajes });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * POST /mensajes/grupo
     */
    async enviarMensajeGrupo(req, res) {
        const { idAutor, idGrupoDestino, mensaje } = req.body;
        
        if (!idAutor || !idGrupoDestino || !mensaje || mensaje.trim() === "") {
            return res.status(400).json({ ok: false, error: "Faltan datos obligatorios para enviar el mensaje." });
        }

        try {
            const nuevoMensaje = await this.dao.guardarMensajeGrupo({ idAutor, idGrupoDestino, mensaje });
            res.status(201).json({ ok: true, mensaje: "Mensaje enviado con éxito", data: nuevoMensaje });
        } catch (err) {
            this.#error(res, err);
        }
    }

    #error(res, err) {
        console.error('Error en mensajeControlador:', err.message);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
}

module.exports = mensajesDControlador;