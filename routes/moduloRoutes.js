const express = require('express');
const pool = require('../poolDb');
const ModuloDAO = require('../dao/moduloDAO');
const ModuloControlador = require('../controladores/moduloControlador');

const router = express.Router();
const controlador = new ModuloControlador(new ModuloDAO(pool));

router.get('/', (req, res) => controlador.listar(req, res));

router.get('/:id', (req, res) => controlador.listarPorID(req, res));

module.exports = router;