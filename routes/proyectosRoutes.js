const express = require('express');
const pool = require('../poolDb'); 
const ProyectosDAO = require('../dao/proyectosDAO');
const ProyectosControlador = require('../controladores/proyectosControlador');

const router = express.Router();
const controlador = new ProyectosControlador(new ProyectosDAO(pool));

// Rutas existentes
/*router.get('/proyectos/usuarios', (req, res) => controlador.listarUsuarios(req, res));*/
router.get('/usuarios', (req, res) => controlador.listarUsuarios(req, res));

router.post('/crear', (req, res) => controlador.crear(req, res));
router.get('/listarProyectos', (req, res)=> controlador.listarProyectos(req, res))
router.get('/listarDODProyectos/:id', (req, res)=> controlador.listarDODProyectoPorID(req, res))

// NUEVA RUTA: Endpoint que procesa el Aceptar o Rechazar desde el correo
router.get('/invitacion/responder', (req, res) => controlador.responderInvitacion(req, res));


module.exports = router;