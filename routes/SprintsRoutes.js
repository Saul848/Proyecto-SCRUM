const express = require('express');
const pool = require('../poolDb'); 

// Importa las clases correctas para Sprints
const SprintsDAO = require('../dao/sprintsDAO');
const SprintsControlador = require('../controladores/sprintsControlador');

const router = express.Router();
const controlador = new SprintsControlador(new SprintsDAO(pool));

/**
 * Obtiene todos los sprints existentes en un proyecto
 */
router.get('/listar/:idProyecto', (req, res) => controlador.listarSprintsPorProyecto(req, res));

/**
 * Agrega un nuevo sprint a un proyecto
 */
router.post('/guardar', (req, res) => controlador.agregarSprint(req, res));

/**
 * Modifica un sprint en el proyecto (Cambiado a PUT y agregados los parámetros)
 */
router.put('/actualizar/:sprintId/:idProyecto', (req, res) => controlador.modificarSprint(req, res));

/**
 * Elimina un sprint de un proyecto mediante sus respectivos ids
 */
router.delete('/eliminar/:sprintId/:idProyecto', (req, res) => controlador.eliminarSprint(req, res));

/**
 * Actualiza el estado de un sprint
 */
router.put('/estado/:sprintId/:idProyecto', (req, res) => controlador.actualizarEstadoSprint(req, res));

module.exports = router;