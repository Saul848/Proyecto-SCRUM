const router = require('express').Router();

const crearImpedimentoControlador = require('../controladores/impedimentoControlador'); // Ajusta la ruta según donde guardes tus controladores
const pool = require('../poolDb');
const impedimentoControlador = crearImpedimentoControlador(pool);

// Rutas para la gestión de impedimentos
router.get('/:idProyecto/:idSprint', impedimentoControlador.listarPorSprint);
router.post('/crear', impedimentoControlador.agregar);
router.put('/resolver/:idImpedimento', impedimentoControlador.resolver);

module.exports = router;