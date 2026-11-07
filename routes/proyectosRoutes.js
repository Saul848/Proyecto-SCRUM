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
router.get('/listarProyectosDeUsuario/:id', (req, res)=> controlador.listarProyectosDeUsuario(req,res))

// NUEVA RUTA: Endpoint que procesa el Aceptar o Rechazar desde el correo
router.get('/invitacion/responder', (req, res) => controlador.responderInvitacion(req, res));
/**
 * Endpoint para obtener los datos del Burndown Chart del Product Backlog (PB-56)
 */
router.get("/product-backlog-por-sprint/:idProyecto", async (req, res) => {
  const idProyecto = Number(req.params.idProyecto);

  if (!Number.isInteger(idProyecto) || idProyecto <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "Proyecto inválido."
    });
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        s.id AS id_sprint,
        s.no_iteracion,
        TO_CHAR(s.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        TO_CHAR(s.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
        COUNT(h.id)::integer AS historias_planificadas,
        COALESCE(SUM(h.horas_calculadas), 0) AS total_horas
      FROM scrumbird.sprint s
      LEFT JOIN scrumbird.historia_de_usuario h
        ON h.asignado_al_sprint = s.id
       AND h.id_proyecto = s.id_proyecto
      WHERE s.id_proyecto = $1
      GROUP BY s.id, s.no_iteracion
      ORDER BY s.no_iteracion, s.id;
    `, [idProyecto]);

    res.json({
      ok: true,
      datos: rows.map(fila => ({
        ...fila,
        total_horas: Number(fila.total_horas)
      }))
    });
  } catch (error) {
    console.error("Error consultando burndown:", error);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudieron obtener los datos."
    });
  }
});
module.exports = router;