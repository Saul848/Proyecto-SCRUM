const express = require('express');
const pool = require('../poolDb');

const router = express.Router();

/**
 * Obtener historial de mensajes de un grupo o canal específico
 */
router.get('/grupo/:id_grupo', async (req, res) => {
    try {
        const { id_grupo } = req.params;
        const query = `
            SELECT m.*, u.nombre AS autor_nombre 
            FROM mensaje_grupo m
            JOIN usuario u ON m.id_autor = u.id
            WHERE m.id_grupo_destino = $1 
            ORDER BY m.fecha ASC
        `;
        const { rows } = await pool.query(query, [id_grupo]);
        res.json({ ok: true, data: rows });
    } catch (error) {
        console.error("Error al obtener mensajes de grupo:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});

/**
 * Enviar un mensaje a un grupo o canal
 */
router.post('/grupo', async (req, res) => {
    try {
        const { id_autor, id_grupo_destino, mensaje } = req.body;
        const query = `
            INSERT INTO mensaje_grupo (id_autor, id_grupo_destino, mensaje, fecha) 
            VALUES ($1, $2, $3, NOW()) 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [id_autor, id_grupo_destino, mensaje]);
        res.json({ ok: true, data: rows[0], mensaje: "Mensaje enviado con éxito" });
    } catch (error) {
        console.error("Error al enviar mensaje de grupo:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});

/**
 * Obtener historial de mensajes privados (1 a 1) entre dos usuarios
 */
router.get('/privado/:id_usuario1/:id_usuario2', async (req, res) => {
    try {
        const { id_usuario1, id_usuario2 } = req.params;
        const query = `
            SELECT * FROM mensaje 
            WHERE (id_autor = $1 AND id_usuario_destino = $2) 
               OR (id_autor = $2 AND id_usuario_destino = $1)
            ORDER BY fecha ASC
        `;
        const { rows } = await pool.query(query, [id_usuario1, id_usuario2]);
        res.json({ ok: true, data: rows });
    } catch (error) {
        console.error("Error al obtener mensajes privados:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});

/**
 * Enviar un mensaje privado (1 a 1)
 */
router.post('/privado', async (req, res) => {
    try {
        const { id_autor, id_usuario_destino, mensaje } = req.body;
        const query = `
            INSERT INTO mensaje (id_autor, id_usuario_destino, mensaje, fecha) 
            VALUES ($1, $2, $3, NOW()) 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [id_autor, id_usuario_destino, mensaje]);
        res.json({ ok: true, data: rows[0], mensaje: "Mensaje privado enviado con éxito" });
    } catch (error) {
        console.error("Error al enviar mensaje privado:", error);
        res.status(500).json({ ok: false, mensaje: error.message });
    }
});

module.exports = router;