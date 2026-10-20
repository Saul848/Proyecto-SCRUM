const express = require('express');
const pool = require('../poolDb'); 
const ProyectosDAO = require('../dao/proyectosDAO');
const ProyectosControlador = require('../controladores/proyectosControlador');

const router = express.Router();
const controlador = new ProyectosControlador(new ProyectosDAO(pool));

// Rutas existentes
router.get('/usuarios', (req, res) => controlador.listarUsuarios(req, res));
router.post('/', (req, res) => controlador.crear(req, res));

// NUEVA RUTA: Endpoint que procesa el Aceptar o Rechazar desde el correo
router.get('/invitacion/responder', (req, res) => controlador.responderInvitacion(req, res));

module.exports = router;