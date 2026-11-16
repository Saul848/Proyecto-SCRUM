const express = require('express');
const pool = require('../poolDb');
const SeccionesDAO = require('../dao/seccionesDAO');
const SeccionesControlador = require('../controladores/seccionesControlador');

const router = express.Router();
const controlador = new SeccionesControlador(new SeccionesDAO(pool));

router.get('/', (req, res) => controlador.listar(req, res));
router.get('/:id', (req, res) => controlador.listarPorID(req, res));

module.exports = router;