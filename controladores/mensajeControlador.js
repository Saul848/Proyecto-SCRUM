const pool = require('../poolDb');
const MensajeDAO = require('../dao/MensajeDAO');
const mensajeDAO = new MensajeDAO(pool);

const mensajeControlador = {
    // --- Privados ---
    obtenerPrivados: async (req, res) => {
        try {
            const { idUsuario1, idUsuario2 } = req.query;
            const mensajes = await mensajeDAO.listarMensajesPrivados(idUsuario1, idUsuario2);
            res.json({ success: true, mensajes });
        } catch (error) {
            console.error("Error al obtener mensajes privados:", error);
            res.status(500).json({ success: false, message: "Error interno" });
        }
    },

    enviarPrivado: async (req, res) => {
        try {
            const { idAutor, idUsuarioDestino, mensaje } = req.body;
            const nuevoMensaje = await mensajeDAO.crearMensajePrivado({ idAutor, idUsuarioDestino, mensaje });
            res.status(201).json({ success: true, mensaje: nuevoMensaje });
        } catch (error) {
            console.error("Error al enviar mensaje privado:", error);
            res.status(500).json({ success: false, message: "Error interno" });
        }
    },

    // --- Canales ---
    obtenerCanalesProyecto: async (req, res) => {
        try {
            const { idProyecto } = req.params;
            const canales = await mensajeDAO.listarCanalesPorProyecto(idProyecto);
            res.json({ success: true, canales });
        } catch (error) {
            console.error("Error al obtener canales:", error);
            res.status(500).json({ success: false, message: "Error interno" });
        }
    },

    obtenerMensajesCanal: async (req, res) => {
        try {
            const { idCanal } = req.params;
            const mensajes = await mensajeDAO.listarMensajesCanal(idCanal);
            res.json({ success: true, mensajes });
        } catch (error) {
            console.error("Error al obtener mensajes de canal:", error);
            res.status(500).json({ success: false, message: "Error interno" });
        }
    },

    enviarMensajeCanal: async (req, res) => {
        try {
            const { idAutor, idCanal, mensaje } = req.body;
            const nuevoMensaje = await mensajeDAO.crearMensajeCanal({ idAutor, idCanal, mensaje });
            res.status(201).json({ success: true, mensaje: nuevoMensaje });
        } catch (error) {
            console.error("Error al enviar mensaje a canal:", error);
            res.status(500).json({ success: false, message: "Error interno" });
        }
    },   
obtenerMensajesGrupo: async (req, res) => {
    try {
        const { idGrupo } = req.params;
        const { idUsuario } = req.query;

        if (!idGrupo || !idUsuario) {
            return res.status(400).json({
                success: false,
                message: "El grupo y el usuario son obligatorios"
            });
        }

        const mensajes = await mensajeDAO.listarMensajesGrupo(
            idGrupo,
            idUsuario
        );

        res.json({ success: true, mensajes });

    } catch (error) {
        console.error("Error al obtener mensajes de grupo:", error);

        res.status(500).json({
            success: false,
            message: "Error interno"
        });
    }
},    
enviarMensajeGrupo: async (req, res) => {
    try {
        const { idAutor, idGrupoDestino, mensaje } = req.body;

        if (!idAutor || !idGrupoDestino ||
            typeof mensaje !== "string" || !mensaje.trim()) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }

        const nuevoMensaje = await mensajeDAO.crearMensajeGrupo({
            idAutor,
            idGrupoDestino,
            mensaje
        });

        res.status(201).json({
            success: true,
            mensaje: nuevoMensaje
        });

    } catch (error) {
        console.error("Error al enviar mensaje a grupo:", error);

        if (error.message === "El usuario no pertenece a este grupo") {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Error interno"
        });
    }
}

};

module.exports = mensajeControlador;