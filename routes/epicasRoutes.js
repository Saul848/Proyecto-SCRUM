const express = require('express');
const pool = require('../poolDb');
const epicasDAO = require('../dao/epicasDAO');
const epicasControlador = require('../controladores/epicasControlador');

const router = express.Router();
const controlador = new epicasControlador(new epicasDAO(pool));

/**
 * Obtiene todas las epicas existentes en un proyecto
 */
router.get('/:idProyecto', (req, res) => controlador.obtenerEpicasEnProyecto(req, res));

/**
 * Agrega una nueva epica al proyecto
 */
router.post('/', (req, res) => controlador.agregarEpicaEnProyecto(req, res));

/**
 * Elimina una epica de un proyecto mediante sus respectivos ids
 */
router.delete('/:idEpica/:idProyecto', (req, res) => controlador.eliminarEpicaEnProyecto(req, res));

/**
 * Modificar una epica de un proyecto mediante sus respectivos ids
 */
router.put('/:idEpica/:idProyecto', (req, res) => controlador.modificarEpicaEnProyecto(req, res));

module.exports = router;