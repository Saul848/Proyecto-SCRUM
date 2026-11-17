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
    // Obtener las secciones de un módulo.
    async listarPorModulo(req, res) {
        const idModulo = this.#idValido(req.params.idModulo);

        if (!idModulo) {
            return res.status(400).json({
            ok: false,
            error: "ID de módulo inválido."
            });
        }

        try {
            const secciones =
            await this.dao.obtenerSeccionesDeModulo(idModulo);

            return res.json(secciones);
        } catch (error) {
            console.error(
            "Error al consultar secciones del módulo:",
            error
            );

            return res.status(500).json({
            ok: false,
            error: "No se pudieron consultar las secciones del módulo."
            });
        }
    }

    // ---- Métodos privados ----

    #idValido(valor) {
        const id = Number(valor);
        return Number.isInteger(id) && id > 0 ? id : null;
    }
    
}
module.exports = seccionesControlador;