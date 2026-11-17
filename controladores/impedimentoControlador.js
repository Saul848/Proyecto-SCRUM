const ImpedimentoDAO = require('../dao/impedimentoDAO');

class impedimentoControlador {
    constructor(pool) {
        this.dao = new ImpedimentoDAO(pool);
    }

    listarPorSprint = async (req, res) => {
        try {
            const { idProyecto, idSprint } = req.params;
            const impedimentos = await this.dao.obtenerImpedimentosSprint(idProyecto, idSprint);
            res.status(200).json({ success: true, data: impedimentos });
        } catch (err) {
            this.#error(res, err);
        }
    }

    agregar = async (req, res) => {
        try {
            const { idProyecto, idSprint, idHistoria, idUsuarioReporta, descripcion } = req.body;
            if (!idProyecto || !idSprint || !idHistoria || !idUsuarioReporta || !descripcion) {
                return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios" });
            }
            const resultado = await this.dao.crearImpedimento(req.body);
            res.status(201).json(resultado);
        } catch (err) {
            this.#error(res, err);
        }
    }

    resolver = async (req, res) => {
        try {
            const { idImpedimento } = req.params;
            const { solucion } = req.body;
            const resultado = await this.dao.resolverImpedimento(idImpedimento, solucion);
            res.status(200).json(resultado);
        } catch (err) {
            this.#error(res, err);
        }
    }

    #error(res, err) {
        console.error('Error en impedimentoControlador:', err.message);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
}

module.exports = function(pool) {
    return new impedimentoControlador(pool);
};