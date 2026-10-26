const express = require('express');
const pool = require('../poolDb'); // aqui mismo en las rutas se exporta { pool } 
const HistoriaUsuarioDAO = require('../dao/historiaUsuarioDAO');
const HistoriaUsuarioControlador = require('../controladores/historiaUsuarioControlador');
const historiaUsuarioControlador = require('../controladores/historiaUsuarioControlador');

const router = express.Router();
const controlador = new HistoriaUsuarioControlador(new HistoriaUsuarioDAO(pool));

// "login" va antes de "/:id" para que no se confunda con un id
router.get('/', (req, res) => controlador.listar(req, res));
router.post('/', (req, res) => controlador.agregar(req, res));
router.delete("/", (req, res) => controlador.eliminarHistoriaC(req, res));
module.exports = router;