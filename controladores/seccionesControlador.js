class seccionesControlador {
    constructor(seccionesDAO) {
        this.dao = seccionesDAO;
    }

    // GET /secciones
    async listar(req, res) {
        try {
            res.json(await this.dao.listar());
        } catch (err) {
            console.error('ERROR AL listar secciones:', err.message);
            res.status(500).json({ ok: false, error: 'No se pudo listar secciones' });
        }
    }

    // GET /secciones/:id
    async listarPorID(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });
        try {
            const seccion = await this.dao.obtenerPorId(id);
            if (!seccion) return res.status(404).json({ error: 'seccion no encontrado' });
            res.json(seccion);
        } catch (err) {
            console.error("Error al recuperar el modulo por id: " , err.message);
        }
    }

    // ---- Métodos privados ----

    #idValido(valor) {
        const id = Number(valor);
        return Number.isInteger(id) && id > 0 ? id : null;
    }
}
module.exports = seccionesControlador;