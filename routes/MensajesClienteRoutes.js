const express = require('express');
const router = express.Router();
const pool = require('../poolDb'); 
const MensajesClienteDAO = require('../dao/MensajesClienteDAO');
const MensajeClienteControlador = require('../controladores/MensajeClienteControlador');  

router.get('/canales/:idProyecto', MensajeClienteControlador.obtenerCanales);
router.get('/:idCanal', MensajeClienteControlador.obtenerMensajes); 
router.post('/', MensajeClienteControlador.enviarMensaje); 
router.get('/directos/:idUsuario/:idDestino', MensajeClienteControlador.obtenerMensajesDirectos);
router.post('/directos', MensajeClienteControlador.guardarMensajeDirecto);
module.exports = router;
