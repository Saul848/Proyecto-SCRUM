const express = require('express');
const router = express.Router();
const mensajeControlador = require('../controladores/mensajeControlador');

// --- RUTAS DE MENSAJES PRIVADOS ---
router.get('/privados', mensajeControlador.obtenerPrivados);
router.post('/privados', mensajeControlador.enviarPrivado);

// --- RUTAS DE CANALES ---
router.get('/canales/:idProyecto', mensajeControlador.obtenerCanalesProyecto);
router.get('/canales/mensajes/:idCanal', mensajeControlador.obtenerMensajesCanal);
router.post('/canales/mensajes', mensajeControlador.enviarMensajeCanal);

// --- RUTAS DE GRUPOS ---
router.get('/grupos', mensajeControlador.obtenerGruposUsuario);
router.get('/grupos/mensajes/:idGrupo', mensajeControlador.obtenerMensajesGrupo);
router.post('/grupos/mensajes', mensajeControlador.enviarMensajeGrupo);

module.exports = router;