const express = require('express');
const pool = require('../poolDb'); // aqui mismo en las rutas se exporta { pool } 
const UsuarioDAO = require('../dao/UsuarioDAO');
const UsuariosControlador = require('../controladores/UsuarioControlador');

const router = express.Router();
const controlador = new UsuariosControlador(new UsuarioDAO(pool));

// "login" va antes de "/:id" para que no se confunda con un id
router.post('/login', (req, res) => controlador.login(req, res));

router.get('/', (req, res) => controlador.listar(req, res));
router.get('/scrumbird', (req, res) => controlador.listar2(req, res));
router.post('/', (req, res) => controlador.crear(req, res));
router.get('/:id', (req, res) => controlador.obtener(req, res));
router.put('/:id', (req, res) => controlador.actualizar(req, res));
router.put('/:id/passwd', (req, res) => controlador.cambiarPasswd(req, res));
router.delete('/:id', (req, res) => controlador.eliminar(req, res));

module.exports = router;