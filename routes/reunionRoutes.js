const crearReunionControlador = require('../controladores/reunionControlador');
const pool = require('../poolDb');
const reunionControlador = crearReunionControlador(pool);

const router = require('express').Router();
router.get('/:idSprint/historias', reunionControlador.obtenerHistorias);
router.post('/seleccion', reunionControlador.guardarSeleccion);
module.exports = router;
