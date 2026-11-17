class moduloControlador {
    constructor(moduloDAO) {
        this.dao = moduloDAO;
    }

    // GET /modulos
    async listar(req, res) {
        try {
            res.json(await this.dao.listar());
        } catch (err) {
            console.error('ERROR AL listar modulos:', err.message);
            res.status(500).json({ ok: false, error: 'No se pudo listar modulos' });
        }
    }

    // GET /modulos/:id
    async listarPorID(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });
        try {
            const modulo = await this.dao.obtenerPorId(id);
            if (!modulo) return res.status(404).json({ error: 'modulo no encontrado' });
            res.json(modulo);
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
module.exports = moduloControlador;