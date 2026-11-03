class RegistroTiemposControlador {
    constructor(registroTiemposDAO) {
        this.dao = registroTiemposDAO;
    }

    async crear(req, res) {
        try {
            const { actividad, idUsuario } = req.body;

            if (!actividad || !idUsuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "La actividad y el id de usuario son obligatorios."
                });
            }

            const registro = await this.dao.crear({ actividad, idUsuario });
            res.status(201).json({ ok: true, data: registro });
        } catch (err) {
            console.error("Error al crear el registro de tiempo:", err.message);
            res.status(500).json({ ok: false, mensaje: "Error al crear el registro" });
        }
    }

    async finalizar(req, res) {
        try {
            const { id } = req.params;
            const { hecho, pendiente } = req.body;

            const registro = await this.dao.finalizar(id, { hecho, pendiente });

            if (!registro) {
                return res.status(404).json({ ok: false, mensaje: "Registro no encontrado" });
            }

            res.status(200).json({ ok: true, data: registro });
        } catch (err) {
            console.error("Error al finalizar el registro de tiempo:", err.message);
            res.status(500).json({ ok: false, mensaje: "Error al finalizar el registro" });
        }
    }

    async listarPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const registros = await this.dao.listarPorUsuario(idUsuario);
            res.status(200).json({ ok: true, data: registros });
        } catch (err) {
            console.error("Error al listar los registros de tiempo:", err.message);
            res.status(500).json({ ok: false, mensaje: "Error al obtener los registros" });
        }
    }
}

module.exports = RegistroTiemposControlador;