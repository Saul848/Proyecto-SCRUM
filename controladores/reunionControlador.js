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

    // En reunionControlador.js
    const eliminarReunion = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const eliminadas = await reunionDAO.eliminarReunion(idReunion);
            if (eliminadas === 0) {
                return res.status(404).json({ ok: false, error: 'Reunión no encontrada' });
            }
            res.json({ ok: true, mensaje: 'Reunión eliminada correctamente' });
        } catch (err) {
            console.error('ERROR AL ELIMINAR REUNIÓN:', err.message);
            res.status(500).json({ ok: false, error: 'No se pudo eliminar la reunión' });
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
            const idDesarrollador = req.query.idDesarrollador ? Number(req.query.idDesarrollador) : null;
            const historias = await reunionDAO.obtenerHistoriasPorSprint(idSprint, idDesarrollador);
            res.json({ ok: true, data: historias });
        } catch (err) {
            console.error('ERROR AL OBTENER HISTORIAS DEL SPRINT:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const cambiarEstadoFinalizada = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const { sprint, proyectoId, fechaInicio, fechaFin, asignaciones } = req.body || {};

            await reunionDAO.finalizarReunion(idReunion);

            if (Array.isArray(asignaciones) && asignaciones.length > 0 && typeof reunionDAO.guardarAsignacionesSprint === "function") {
                await reunionDAO.guardarAsignacionesSprint({
                    idSprint: Number(sprint),
                    idProyecto: Number(proyectoId),
                    fechaInicio: fechaInicio || null,
                    fechaFin: fechaFin || null,
                    asignaciones
                });
            }

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

    const obtenerDaily = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const data = await reunionDAO.obtenerDaily(idReunion);
            if (!data) return res.status(404).json({ ok: false, error: 'Daily no encontrada' });
            res.json({ ok: true, data });
        } catch (err) {
            console.error('ERROR AL OBTENER DAILY:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    const publicarDaily = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const { idUsuario, ayer, hoy, tieneImpedimento, impedimento, idHistoria } = req.body;

            if (!idUsuario || !ayer?.trim() || !hoy?.trim()) {
                return res.status(400).json({ ok: false, error: 'Completa lo que hiciste ayer y lo que harás hoy.' });
            }
            if (tieneImpedimento && (!impedimento?.trim() || !idHistoria)) {
                return res.status(400).json({ ok: false, error: 'Describe el impedimento y elige la historia afectada.' });
            }

            await reunionDAO.guardarRespuestaDaily(idReunion, idUsuario, {
                ayer: ayer.trim(),
                hoy: hoy.trim(),
                tieneImpedimento: !!tieneImpedimento,
                impedimento: tieneImpedimento ? impedimento.trim() : null,
                idHistoria: tieneImpedimento ? Number(idHistoria) : null
            });
            res.json({ ok: true, mensaje: 'Actualización publicada' });
        } catch (err) {
            console.error('ERROR AL PUBLICAR DAILY:', err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    };

    //retrospectiva
    const responderErrorRetro = (res, err, etiqueta) => {
        console.error(etiqueta, err.message);
        res.status(err.negocio ? 400 : 500).json({ ok: false, error: err.message });
    };

    const obtenerRetrospectiva = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const idUsuario = req.query.idUsuario ? Number(req.query.idUsuario) : null;
            const data = await reunionDAO.obtenerRetrospectiva(idReunion, idUsuario);
            if (!data) return res.status(404).json({ ok: false, error: 'Retrospectiva no encontrada' });
            res.json({ ok: true, data });
        } catch (err) {
            responderErrorRetro(res, err, 'ERROR AL OBTENER RETROSPECTIVA:');
        }
    };

    const agregarNotaRetro = async (req, res) => {
        try {
            const { idReunion } = req.params;
            const { idUsuario, categoria, texto } = req.body;
            if (!idUsuario) return res.status(400).json({ ok: false, error: 'Falta el usuario.' });
            const id = await reunionDAO.agregarNotaRetro(idReunion, Number(idUsuario), { categoria, texto });
            res.json({ ok: true, data: { id }, mensaje: 'Nota agregada' });
        } catch (err) {
            responderErrorRetro(res, err, 'ERROR AL AGREGAR NOTA DE RETRO:');
        }
    };

    const votarNotaRetro = async (req, res) => {
        try {
            const { idReunion, idNota } = req.params;
            const { idUsuario } = req.body;
            if (!idUsuario) return res.status(400).json({ ok: false, error: 'Falta el usuario.' });
            await reunionDAO.alternarVotoRetro(idReunion, Number(idUsuario), idNota);
            res.json({ ok: true, mensaje: 'Voto actualizado' });
        } catch (err) {
            responderErrorRetro(res, err, 'ERROR AL VOTAR NOTA DE RETRO:');
        }
    };

    const compromisoNotaRetro = async (req, res) => {
        try {
            const { idReunion, idNota } = req.params;
            const { idUsuario } = req.body;
            if (!idUsuario) return res.status(400).json({ ok: false, error: 'Falta el usuario.' });
            await reunionDAO.alternarCompromisoRetro(idReunion, Number(idUsuario), idNota);
            res.json({ ok: true, mensaje: 'Compromiso actualizado' });
        } catch (err) {
            responderErrorRetro(res, err, 'ERROR AL MARCAR COMPROMISO DE RETRO:');
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
        devolverBacklog,
        obtenerDaily, 
        publicarDaily,
        eliminarReunion,
        obtenerRetrospectiva,
        agregarNotaRetro,
        votarNotaRetro,
        compromisoNotaRetro
    };
}

module.exports = crearReunionControlador;