class impedimentoDAO {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Obtiene todos los impedimentos de un sprint con el nombre del usuario y la historia
     */
    async obtenerImpedimentosSprint(idProyecto, idSprint) {
        try {
            const query = `
                SELECT 
                    i.id,
                    i.descripcion,
                    i.estado,
                    i.solucion,
                    i.fecha_reporte,
                    h.nombre AS nombre_historia,
                    u.nombre AS nombre_desarrollador
                FROM scrumbird.impedimento i
                JOIN scrumbird.historia_de_usuario h ON i.id_historia = h.id
                JOIN scrumbird.usuario u ON i.id_usuario_reporta = u.id
                WHERE i.id_proyecto = $1 AND i.id_sprint = $2
                ORDER BY i.fecha_reporte DESC;
            `;
            const { rows } = await this.pool.query(query, [idProyecto, idSprint]);
            return rows;
        } catch (error) {
            console.error("Error al obtener los impedimentos:", error);
            throw error;
        }
    }

    /**
     * Inserta un nuevo impedimento reportado por un desarrollador
     */
    async crearImpedimento({ idProyecto, idSprint, idHistoria, idUsuarioReporta, descripcion }) {
        try {
            const query = `
                INSERT INTO scrumbird.impedimento 
                (id_proyecto, id_sprint, id_historia, id_usuario_reporta, descripcion, estado)
                VALUES ($1, $2, $3, $4, $5, 'pendiente')
                RETURNING id;
            `;
            const { rows } = await this.pool.query(query, [idProyecto, idSprint, idHistoria, idUsuarioReporta, descripcion]);
            return { success: true, id: rows[0].id, mensaje: "Impedimento registrado correctamente" };
        } catch (error) {
            console.error("Error al crear el impedimento:", error);
            throw error;
        }
    }

    /**
     * Actualiza el estado y la solución del impedimento (Acción del Facilitador)
     */
    async resolverImpedimento(idImpedimento, solucion) {
        try {
            const query = `
                UPDATE scrumbird.impedimento 
                SET estado = 'resuelto', solucion = $1
                WHERE id = $2;
            `;
            await this.pool.query(query, [solucion, idImpedimento]);
            return { success: true, mensaje: "Impedimento marcado como resuelto" };
        } catch (error) {
            console.error("Error al actualizar el impedimento:", error);
            throw error;
        }
    }
}

module.exports = impedimentoDAO;