const router = require('express').Router();

const crearReunionControlador = require('../controladores/reunionControlador');
const pool = require('../poolDb');
const reunionControlador = crearReunionControlador(pool);

router.get('/proyecto/:idProyecto', reunionControlador.obtenerReuniones);
router.get('/formulario-datos/:idProyecto', reunionControlador.obtenerDatosFormulario);
router.get('/sprint/:idSprint/historias', reunionControlador.obtenerHistoriasSprint);
router.post('/crear', reunionControlador.guardarReunion);
router.put('/:idReunion/iniciar', reunionControlador.cambiarEstadoEnCurso);
router.put('/:idReunion/finalizar', reunionControlador.cambiarEstadoFinalizada);

module.exports = router;