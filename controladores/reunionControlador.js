const ReunionDAO = require('../dao/reunionDAO');

function crearReunionControlador(pool) {
    const reunionDAO = new ReunionDAO(pool);

    // Obtener historias para la Fase 1
    const obtenerHistorias = async (req, res) => {
        try {
            const idSprint = req.params.idSprint;
            const historias = await reunionDAO.obtenerHistoriasDeIteracion(idSprint);
            res.json({ ok: true, data: historias });
        } catch (err) {
            console.error('Error al obtener historias:', err);
            res.status(500).json({ ok: false, error: 'No se pudieron obtener las historias' });
        }
    };

    // Guardar la selección de prioridades (Fase 1)
    const guardarSeleccion = async (req, res) => {
        try {
            const { ids } = req.body; // arreglo de ids seleccionados
            const resultado = await reunionDAO.marcarPrioritarias(ids);
            res.json({ ok: true, data: { modificadas: resultado.rowCount } });
        } catch (err) {
            console.error('Error al guardar selección:', err);
            res.status(500).json({ ok: false, error: 'No se pudo guardar la selección' });
        }
    };

    return { obtenerHistorias, guardarSeleccion };
}

module.exports = crearReunionControlador;

