const express = require('express');
const pool = require('../poolDb');
const RegistroTiemposDAO = require('../dao/registroTiemposDAO');
const RegistroTiemposControlador = require('../controladores/registroTiemposControlador');

const router = express.Router();
const controlador = new RegistroTiemposControlador(new RegistroTiemposDAO(pool));

router.post('/', (req, res) => controlador.crear(req, res));
router.put('/:id/finalizar', (req, res) => controlador.finalizar(req, res));
router.get('/usuario/:idUsuario', (req, res) => controlador.listarPorUsuario(req, res));

module.exports = router;