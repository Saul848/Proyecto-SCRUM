const express = require('express');
const router = express.Router();
const MensajeDesarrolladorControlador = require('../controladores/mensajeDesarrolladorControlador'); 

/**
 * @file Rutas para la gestión de mensajes de desarrolladores (canales y chat directo).
 * @version 1.0.0
 */

/**
 * Ruta para obtener todos los mensajes de un canal específico.
 * @name GET /mensajes/:idCanal
 * @function
 * @inner
 * @param {string} path - Ruta del endpoint.
 * @param {callback} middleware - Función del controlador que maneja la solicitud.
 */
router.get('/:idCanal', MensajeDesarrolladorControlador.obtenerMensajes); 

/**
 * Ruta para enviar un nuevo mensaje a un canal.
 * @name POST /mensajes
 * @function
 * @inner
 */
router.post('/', MensajeDesarrolladorControlador.enviarMensaje); 

/**
 * Ruta para obtener los mensajes directos (privados) entre el desarrollador y otro usuario.
 * @name GET /mensajes/directos/:idUsuario/:idDestino
 * @function
 * @inner
 */
router.get('/directos/:idUsuario/:idDestino', MensajeDesarrolladorControlador.obtenerMensajesDirectos);

/**
 * Ruta para guardar un nuevo mensaje directo (privado).
 * @name POST /mensajes/directos
 * @function
 * @inner
 */
router.post('/directos', MensajeDesarrolladorControlador.guardarMensajeDirecto);

module.exports = router;