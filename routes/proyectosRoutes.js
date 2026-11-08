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
router.get('/contactos-proyecto/:idProyecto/:idUsuarioActual', async (req, res) => {
    const { idProyecto, idUsuarioActual } = req.params;

    try {
        const query = `
            SELECT u.id, u.nombre, u.nombre_de_usuario, pu.rol
            FROM scrumbird.trabajando_en_proyecto pu
            JOIN scrumbird.usuario u ON pu.id_usuario = u.id
            WHERE pu.id_proyecto = $1 AND u.id != $2;
        `;
        
        const { rows } = await pool.query(query, [idProyecto, idUsuarioActual]);
        res.json({ ok: true, contactos: rows });
    } catch (error) {
        console.error("Error al obtener contactos del equipo:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});
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
    COALESCE(SUM(h.horas_calculadas), 0) AS total_horas,
    c.horas_restantes,
    c.historias_terminadas,
    c.es_prueba
  FROM scrumbird.sprint s
  LEFT JOIN scrumbird.historia_de_usuario h
    ON h.asignado_al_sprint = s.id
   AND h.id_proyecto = s.id_proyecto
  LEFT JOIN scrumbird.burndown_cierre c
    ON c.id_sprint = s.id
  WHERE s.id_proyecto = $1
  GROUP BY
    s.id,
    s.no_iteracion,
    c.horas_restantes,
    c.historias_terminadas,
    c.es_prueba
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
router.get(
  "/burndown-diario/:idProyecto/:idSprint",
  async (req, res) => {
    const idProyecto = Number(req.params.idProyecto);
    const idSprint = Number(req.params.idSprint);

    if (
      !Number.isInteger(idProyecto) || idProyecto <= 0 ||
      !Number.isInteger(idSprint) || idSprint <= 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Proyecto o sprint inválido."
      });
    }

    try {
      // Verificar que el sprint pertenezca al proyecto solicitado.
      const sprint = await pool.query(`
        SELECT id
        FROM scrumbird.sprint
        WHERE id = $1 AND id_proyecto = $2;
      `, [idSprint, idProyecto]);

      if (sprint.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: "El sprint no pertenece al proyecto indicado."
        });
      }

      const { rows } = await pool.query(`
        SELECT
          TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
          d.horas_restantes,
          d.es_prueba
        FROM scrumbird.burndown_diario d
        JOIN scrumbird.sprint s ON s.id = d.id_sprint
        WHERE d.id_sprint = $1
          AND s.id_proyecto = $2
          AND d.fecha BETWEEN s.fecha_inicio AND s.fecha_fin
        ORDER BY d.fecha;
      `, [idSprint, idProyecto]);

      res.json({
        ok: true,
        datos: rows
      });
    } catch (error) {
      console.error("Error consultando burndown diario:", error);

      res.status(500).json({
        ok: false,
        mensaje: "No se pudieron consultar las mediciones diarias."
      });
    }
  }
);
module.exports = router;