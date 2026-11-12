const express = require('express');
const router = express.Router();

const GrupoControlador = require('../controladores/grupoControlador');

/**
 * Rutas para gestionar los grupos de conversación.
 */

// Crear un grupo dentro de un proyecto.
router.post('/crear', GrupoControlador.crearGrupo);
// Consultar los grupos de un usuario dentro de un proyecto.
router.get('/usuario/:idUsuario/proyecto/:idProyecto', GrupoControlador.obtenerGruposUsuario);

// Agregar participantes a un grupo existente
router.post('/:idGrupo/participantes', GrupoControlador.agregarParticipantes);

/**
 * Eliminar a un participante de un grupo.
 */
router.delete('/:idGrupo/participantes/:idParticipante', GrupoControlador.eliminarParticipante);

router.get('/:idGrupo/participantes/usuario/:idUsuario', GrupoControlador.obtenerParticipantes);

module.exports = router;
