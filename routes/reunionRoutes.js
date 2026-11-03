const crearReunionControlador = require('../controladores/reunionControlador');
const pool = require('../poolDb');
const reunionControlador = crearReunionControlador(pool);

const router = require('express').Router();

router.get('/proyecto/:idProyecto', reunionControlador.obtenerReuniones);
router.get('/formulario-datos/:idProyecto', reunionControlador.obtenerDatosFormulario);
router.post('/crear', reunionControlador.guardarReunion);
router.put('/:idReunion/iniciar', reunionControlador.cambiarEstadoEnCurso);

module.exports = router;