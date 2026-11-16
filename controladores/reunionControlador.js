const ReunionDAO = require('../dao/reunionDAO');

function crearReunionControlador(pool) {
    const reunionDAO = new ReunionDAO(pool);

    //se obtienen las reuniones del proyecto
    const obtenerReuniones = async (req, res) => {
        try {
            const { idProyecto } = req.params;
            const reuniones = await reunionDAO.obtenerReunionesPorProyecto(idProyecto);
            res.json({ ok: true, data: reuniones });
        } catch (err) {
            console.error('ERROR AL OBTENER REUNIONES:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    //datos para el formulario (sprints y participantes)
    const obtenerDatosFormulario = async (req, res) => {
        try {
            const { idProyecto } = req.params;
            const sprints = await reunionDAO.obtenerSprintsPorProyecto(idProyecto);
            const participantes = await reunionDAO.obtenerParticipantesPorProyecto(idProyecto);
            const tiposReunion = await reunionDAO.obtenerTiposReunion();

            res.json({ ok: true, data: { sprints, participantes, tiposReunion } });
        } catch (err) {
            console.error('ERROR AL OBTENER DATOS FORMULARIO:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    //crear nueva reunion
    const guardarReunion = async (req, res) => {
        try {
            const { idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin } = req.body;
            
            //si el usuario no puso nombre, auto-generamos uno por defecto
            const nombreFinal = nombre || `Reunión del Sprint ${idSprint}`;

            const nuevaReunionId = await reunionDAO.crearReunion(
                idProyecto, 
                idSprint, 
                idTipoReunion, 
                nombreFinal, 
                fechaInicio, 
                fechaFin
            );

            res.json({ ok: true, data: { id: nuevaReunionId, mensaje: 'Reunión agendada con éxito' } });
        } catch (err) {
            console.error('ERROR AL CREAR REUNIÓN:', err.message);
            res.status(500).json({ ok: false, error: 'No se pudo guardar la reunión' });
        }
    };

    //cambiar estado a 'En curso'
    const cambiarEstadoEnCurso = async (req, res) => {
        try {
            const { idReunion } = req.params;
            await reunionDAO.iniciarReunion(idReunion);
            res.json({ ok: true, mensaje: 'Reunión iniciada correctamente' });
        } catch (err) {
            console.error('ERROR AL INICIAR REUNIÓN:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const obtenerHistoriasSprint = async (req, res) => {
        try {
            const { idSprint } = req.params;
            const historias = await reunionDAO.obtenerHistoriasPorSprint(idSprint);
            res.json({ ok: true, data: historias });
        } catch (err) {
            console.error('ERROR AL OBTENER HISTORIAS DEL SPRINT:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const cambiarEstadoFinalizada = async (req, res) => {
        try {
            const { idReunion } = req.params;
            await reunionDAO.finalizarReunion(idReunion);
            res.json({ ok: true, mensaje: 'Reunión finalizada correctamente' });
        } catch (err) {
            console.error('ERROR AL FINALIZAR REUNIÓN:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    //para la reunión de revisión

    const obtenerHistoriasRevision = async (req, res) => {
        try {
            const { idSprint } = req.params;
            const { idProyecto } = req.query;

            //verifica que haya una reunión de planificación concluida
            const planningTerminado = await reunionDAO.verificarPlanningConcluido(idSprint);
            if (!planningTerminado) {
                return res.status(403).json({ 
                    ok: false, 
                    error: 'No se puede iniciar la revisión: la reunión de Sprint Planning de esta iteración aún no ha finalizado.' 
                });
            }
            //si concluyo la reunión de planificación, se cargan las historias 
            const historias = await reunionDAO.obtenerHistoriasRevisionPorSprint(idSprint, idProyecto);
            res.json({ ok: true, data: historias });
        } catch (err) {
            console.error('ERROR AL OBTENER HISTORIAS DE REVISIÓN:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const revisarHistoria = async (req, res) => {
        try {
            const { idHistoria } = req.params;
            const { estado, comentario, idEmisor, idReunion, idProyecto } = req.body;
            
            await reunionDAO.actualizarRevisionHistoria(idHistoria, estado, comentario, idEmisor, idReunion, idProyecto);
            
            res.json({ ok: true, mensaje: 'Revisión registrada correctamente' });
        } catch (err) {
            console.error('ERROR AL REVISAR HISTORIA:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const devolverBacklog = async (req, res) => {
        try {
            const { idHistoria } = req.params;
            await reunionDAO.devolverHistoriaAProductBacklog(idHistoria);
            res.json({ ok: true, mensaje: 'Historia devuelta al product backlog con éxito' });
        } catch (err) {
            console.error('ERROR AL DEVOLVER HISTORIA:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    return { 
        obtenerReuniones, 
        obtenerDatosFormulario, 
        guardarReunion, 
        cambiarEstadoEnCurso, 
        obtenerHistoriasSprint, 
        cambiarEstadoFinalizada,
        obtenerHistoriasRevision,
        revisarHistoria,
        devolverBacklog
    };
}

module.exports = crearReunionControlador;
