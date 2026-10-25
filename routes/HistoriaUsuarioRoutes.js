const express = require('express');
const pool = require('../poolDb'); // aqui mismo en las rutas se exporta { pool } 
const HistoriaUsuarioDAO = require('../dao/historiaUsuarioDAO');
const HistoriaUsuarioControlador = require('../controladores/historiaUsuarioControlador');

const router = express.Router();
const controlador = new HistoriaUsuarioControlador(new HistoriaUsuarioDAO(pool));

// "login" va antes de "/:id" para que no se confunda con un id
router.get('/', (req, res) => controlador.listar(req, res));

/**
 * Obtiene todas las historias del sprint actual
 * Ejemplo de petición: GET /historiasSprint/1/1  (Proyecto 1, Sprint 1)
 */
router.get('/historiasSprint/:idProyecto/:idSprint', (req, res) => controlador.obtenerHistoriasSprint(req, res));

/**
 * @name GET /
 * @description Obtiene las historias del sprint asignadas a un desarrollador
 * Ejemplo de petición: GET /historiasSprintDev/1/1/2 (Proyecto 1, Sprint 1, Desarrollador 2)
 */
router.get('/historiasSprintDev/:idProyecto/:idSprint/:idDesarrollador', (req, res) => controlador.obtenerHistoriasPorDesarrollador(req, res));

/**
 * @name PUT /
 * @description Actualiza el estado de una historia
 */
router.put('/estado/:idHistoria/:idProyecto', (req, res) => controlador.actualizarEstadoHistoria(req, res));

router.post('/', (req, res) => controlador.agregar(req, res));
module.exports = router;