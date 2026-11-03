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
router.get('/burndown-product-backlog', async (req, res) => {
    try {
        const query = `
            WITH total_puntos AS (
                SELECT COALESCE(SUM(puntos_de_historia), 0) AS total 
                FROM scrumbird.historia_de_usuario
            ),
            sprints_info AS (
                SELECT 
                    s.no_iteracion AS sprint,
                    COALESCE(COUNT(h.id), 0) AS tareas_declaradas,
                    COALESCE(SUM(CASE WHEN th.estado = 'Completada' THEN 1 ELSE 0 END), 0) AS tareas_terminadas,
                    COALESCE(SUM(h.puntos_de_historia), 0) AS puntos_sprint
                FROM scrumbird.sprint s
                LEFT JOIN scrumbird.historia_de_usuario h ON h.asignado_al_sprint = s.id
                LEFT JOIN scrumbird.trabajando_en_historia th ON th.historia_asignada = h.id
                GROUP BY s.no_iteracion
                ORDER BY s.no_iteracion ASC
            )
            SELECT 
                sprint,
                puntos_sprint AS horas_restantes,
                tareas_terminadas,
                tareas_declaradas,
                (SELECT total FROM total_puntos) AS total_inicial
            FROM sprints_info;
        `;

        const { rows } = await pool.query(query);

        // Si hay datos, calculamos la línea Ideal en JS de forma exacta
        const numSprints = rows.length || 1;
        const totalInicial = rows.length > 0 ? parseFloat(rows[0].total_inicial) : 0;
        const decrementoIdeal = totalInicial / (numSprints > 1 ? numSprints - 1 : 1);

        let acumuladoRestante = totalInicial;
        const dataProcesada = rows.map((row, index) => {
            const ideal = Math.max(0, Math.round((totalInicial - (index * decrementoIdeal)) * 10) / 10);
            return {
                sprint: row.sprint,
                horas_restantes: row.horas_restantes,
                tareas_terminadas: row.tareas_terminadas,
                tareas_declaradas: row.tareas_declaradas,
                ideal: ideal
            };
        });

        res.json({ ok: true, data: dataProcesada });
    } catch (error) {
        console.error("Error al obtener datos del burndown:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});
/**
 * Endpoint para obtener los datos del Burndown Chart del Sprint Actual
 */

router.get('/burndown-sprint', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.no_iteracion AS sprint,
                COALESCE(SUM(h.puntos_de_historia), 0) AS horas_restantes
            FROM scrumbird.sprint s
            LEFT JOIN scrumbird.historia_de_usuario h ON h.asignado_al_sprint = s.id
            GROUP BY s.no_iteracion
            ORDER BY s.no_iteracion ASC;
        `;
        const { rows } = await pool.query(query);
        res.json({ ok: true, data: rows });
    } catch (error) {
        console.error("Error al obtener datos del burndown de sprint:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});

module.exports = router;