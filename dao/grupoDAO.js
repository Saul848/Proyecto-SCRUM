const pool = require('../poolDb');

/**
 * Clase DAO para gestionar los grupos de conversación.
 */
class GrupoDAO {

    /**
     * Crea un grupo y registra sus participantes.
     */
    static async crearGrupo(idProyecto, idCreador, nombre, descripcion, participantes) {
        const cliente = await pool.connect();

        try {
            await cliente.query('BEGIN');

            // Comprobar que el creador pertenece al proyecto.
            const creador = await cliente.query(`
                SELECT 1
                FROM scrumbird.trabajando_en_proyecto
                WHERE id_usuario = $1 AND id_proyecto = $2
            `, [idCreador, idProyecto]);

            if (creador.rowCount === 0) {
                throw new Error('El creador no pertenece al proyecto');
            }

            // Evitar participantes repetidos e incluir al creador.
            const idsParticipantes = [
                ...new Set([idCreador, ...participantes])
            ];

            // Validar que todos pertenezcan al proyecto.
            const validacion = await cliente.query(`
                SELECT DISTINCT id_usuario
                FROM scrumbird.trabajando_en_proyecto
                WHERE id_proyecto = $1
                  AND id_usuario = ANY($2::integer[])
            `, [idProyecto, idsParticipantes]);

            if (validacion.rowCount !== idsParticipantes.length) {
                throw new Error('Uno o más participantes no pertenecen al proyecto');
            }

            // Crear el grupo.
            const resultado = await cliente.query(`
                INSERT INTO scrumbird.grupo
                    (nombre, descripcion, id_proyecto)
                VALUES ($1, $2, $3)
                RETURNING id, nombre, descripcion, id_proyecto
            `, [nombre, descripcion, idProyecto]);

            const grupo = resultado.rows[0];

            // Registrar participantes.
            for (const idUsuario of idsParticipantes) {
                await cliente.query(`
                    INSERT INTO scrumbird.esta_en_grupo
                        (id_usuario, id_grupo, administrador)
                    VALUES ($1, $2, $3)
                `, [
                    idUsuario,
                    grupo.id,
                    idUsuario === idCreador
                ]);
            }

            await cliente.query('COMMIT');

            return {
                ...grupo,
                participantes: idsParticipantes
            };

        } catch (error) {
            await cliente.query('ROLLBACK');
            throw error;
        } finally {
            cliente.release();
        }
    }
    
/**
 * Obtiene los grupos a los que pertenece un usuario
 * dentro de un proyecto específico.
 *
 * @param {number} idUsuario - ID del usuario actual.
 * @param {number} idProyecto - ID del proyecto activo.
 * @returns {Promise<Object[]>} Lista de grupos del usuario.
 */
static async obtenerGruposUsuario(idUsuario, idProyecto) {
    const consulta = `
        SELECT
            g.id,
            g.nombre,
            g.descripcion,
            g.id_proyecto,
            eg.administrador
        FROM scrumbird.grupo g
        INNER JOIN scrumbird.esta_en_grupo eg
            ON g.id = eg.id_grupo
        WHERE eg.id_usuario = $1
          AND g.id_proyecto = $2
        ORDER BY g.nombre ASC;
    `;

    const { rows } = await pool.query(consulta, [
        idUsuario,
        idProyecto
    ]);

    return rows;
}

/**
 * Elimina a un participante de un grupo.
 * Solo un administrador del grupo puede realizar esta acción.
 */
static async eliminarParticipante(idGrupo, idAdministrador, idParticipante) {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // Verificar que quien realiza la acción sea administrador.
        const administrador = await cliente.query(`
            SELECT 1
            FROM scrumbird.esta_en_grupo
            WHERE id_grupo = $1
              AND id_usuario = $2
              AND administrador = true
        `, [idGrupo, idAdministrador]);

        if (administrador.rowCount === 0) {
            throw new Error('No tienes permisos para eliminar participantes');
        }

        // Evitar que el administrador se elimine a sí mismo.
        if (idAdministrador === idParticipante) {
            throw new Error('El administrador no puede eliminarse a sí mismo');
        }

        // Eliminar únicamente la relación del participante con el grupo.
        const resultado = await cliente.query(`
            DELETE FROM scrumbird.esta_en_grupo
            WHERE id_grupo = $1
              AND id_usuario = $2
            RETURNING id_usuario, id_grupo
        `, [idGrupo, idParticipante]);

        if (resultado.rowCount === 0) {
            throw new Error('El participante no pertenece al grupo');
        }

        await cliente.query('COMMIT');

        return resultado.rows[0];

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
}

static async obtenerParticipantes(idGrupo, idUsuario) {

    // Verificar que el usuario pertenezca al grupo
    const pertenece = await pool.query(
        `SELECT 1
         FROM scrumbird.esta_en_grupo
         WHERE id_grupo = $1 AND id_usuario = $2`,
        [idGrupo, idUsuario]
    );

    if (pertenece.rowCount === 0) {
        throw new Error('No perteneces a este grupo');
    }

    // Consultar los integrantes y sus permisos
    const resultado = await pool.query(
        `SELECT
            u.id,
            u.nombre,
            u.nombre_de_usuario,
            eg.administrador
         FROM scrumbird.esta_en_grupo eg
         INNER JOIN scrumbird.usuario u
             ON eg.id_usuario = u.id
         WHERE eg.id_grupo = $1
         ORDER BY eg.administrador DESC, u.nombre ASC`,
        [idGrupo]
    );

    return resultado.rows;
}

static async agregarParticipantes(idGrupo, idAdministrador, participantes) {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // 1. Comprobar que el usuario sea administrador
        // y obtener el proyecto al que pertenece el grupo.
        const resultadoGrupo = await cliente.query(
            `SELECT g.id_proyecto
             FROM scrumbird.grupo g
             INNER JOIN scrumbird.esta_en_grupo eg
                 ON eg.id_grupo = g.id
             WHERE g.id = $1
               AND eg.id_usuario = $2
               AND eg.administrador = true
             FOR UPDATE OF g`,
            [idGrupo, idAdministrador]
        );

        if (resultadoGrupo.rowCount === 0) {
            throw new Error(
                'No tienes permisos para agregar participantes'
            );
        }

        const idProyecto = resultadoGrupo.rows[0].id_proyecto;

        // 2. Evitar identificadores repetidos
        const idsParticipantes = [...new Set(participantes)];

        // 3. Verificar que todos pertenezcan al proyecto
        const validacion = await cliente.query(
            `SELECT DISTINCT id_usuario
             FROM scrumbird.trabajando_en_proyecto
             WHERE id_proyecto = $1
               AND id_usuario = ANY($2::integer[])`,
            [idProyecto, idsParticipantes]
        );

        if (validacion.rowCount !== idsParticipantes.length) {
            throw new Error(
                'Uno o más participantes no pertenecen al proyecto'
            );
        }

        // 4. Comprobar que no estén agregados previamente
        const existentes = await cliente.query(
            `SELECT id_usuario
             FROM scrumbird.esta_en_grupo
             WHERE id_grupo = $1
               AND id_usuario = ANY($2::integer[])`,
            [idGrupo, idsParticipantes]
        );

        if (existentes.rowCount > 0) {
            throw new Error(
                'Uno o más participantes ya pertenecen al grupo'
            );
        }

        // 5. Registrar a los nuevos integrantes
        for (const idUsuario of idsParticipantes) {
            await cliente.query(
                `INSERT INTO scrumbird.esta_en_grupo
                    (id_usuario, id_grupo, administrador)
                 VALUES ($1, $2, false)`,
                [idUsuario, idGrupo]
            );
        }

        // 6. Confirmar todos los cambios
        await cliente.query('COMMIT');

        return {
            idGrupo,
            participantesAgregados: idsParticipantes
        };

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;

    } finally {
        cliente.release();
    }
}

}

module.exports = GrupoDAO;
