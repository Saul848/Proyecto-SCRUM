const router = require('express').Router();

const crearReunionControlador = require('../controladores/reunionControlador');
const pool = require('../poolDb');
const reunionControlador = crearReunionControlador(pool);

router.get('/proyecto/:idProyecto', reunionControlador.obtenerReuniones);
router.get('/formulario-datos/:idProyecto', reunionControlador.obtenerDatosFormulario);
router.get('/sprint/:idSprint/historias', reunionControlador.obtenerHistoriasSprint);
router.get('/sprint/:idSprint/historias-revision', reunionControlador.obtenerHistoriasRevision);
router.get('/:idReunion/daily', reunionControlador.obtenerDaily);
router.post('/crear', reunionControlador.guardarReunion);
router.post('/:idReunion/daily', reunionControlador.publicarDaily);
router.put('/:idReunion/iniciar', reunionControlador.cambiarEstadoEnCurso);
router.put('/:idReunion/finalizar', reunionControlador.cambiarEstadoFinalizada);
router.post('/historia/:idHistoria/revisar', reunionControlador.revisarHistoria);
router.put('/historia/:idHistoria/devolver', reunionControlador.devolverBacklog);
router.delete('/:idReunion', reunionControlador.eliminarReunion);

module.exports = router;