const fs = require('fs');
const path = require('path');

//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class historiaUsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }

    /**
     * Funcion que me permite obtener todas las historias de usuario pertenecientes a un proyecto ordenadas por id
     * @returns ID, Nombre, Descripcion, Valor, AsignadoAlSprint 
     */
    async obtenerHistorias(idProyecto) {
        try {
            const query = 'SELECT id, nombre, descripcion, valor, asignado_al_sprint FROM scrumbird.historia_de_usuario WHERE id_proyecto = $1 ORDER BY id;';
            const { rows } = await this.pool.query(query, [idProyecto]);
            return rows;
        } catch (error) {
            console.error("Error al obtener las historias del proyecto:", error);
            throw error;
        }
    }

    /**
     * Obtiene un arreglo de historias de usuario pertenecientes a un proyecto, donde cada una incluye un arreglo con sus criterios de aceptación.
     * @param {Object} pool Pool de conexiones a la base de datos (pg)
     * @returns {acc} Arreglo de historias de usuario con sus criterios anidados
     */
    async obtenerHistoriasEnProyecto(idProyecto) {
        //Se prepara la consulta
        const query = `
            SELECT 
                t_historias.id,
                t_historias.numero_de_historia, 
                t_historias.nombre, 
                t_historias.descripcion, 
                t_historias.valor,
                t_historias.horas_estimadas,
                t_historias.pendiente,
                t_historias.asignado_al_sprint,
                t_historias.puntos_de_historia,
                t_epicas.nombre AS epica_asignada,
                t_trabajando.estado, 
                t_criterios.id AS id_criterio, 
                t_criterios.numero_de_criterio,
                t_criterios.criterios_de_aceptacion
                
            FROM 
                scrumbird.historia_de_usuario t_historias
            LEFT JOIN 
                scrumbird.sprint t_sprint 
                ON t_historias.asignado_al_sprint = t_sprint.id
            LEFT JOIN 
                scrumbird.criterios_de_aceptacion t_criterios 
                ON t_historias.id = t_criterios.id_historia 
                AND t_historias.id_proyecto = t_criterios.id_proyecto
            LEFT JOIN 
                scrumbird.trabajando_en_historia t_trabajando
                ON t_historias.id = t_trabajando.historia_asignada
                AND t_historias.id_proyecto = t_trabajando.id_proyecto
            LEFT JOIN 
                scrumbird.epicas t_epicas
                ON t_historias.epica_asignada = t_epicas.id
                AND t_historias.id_proyecto = t_epicas.id_proyecto
            WHERE 
                t_historias.id_proyecto = $1
            ORDER BY 
                t_historias.numero_de_historia ASC, 
                t_criterios.numero_de_criterio ASC;
        `
        /**
         * Como se observa arriba se utiliza la Palabra LEFT JOIN , esto
         * garantiza que se obtengan las historias de usuario aun cuando
         * estas no tienen criterios de aceptacion (Medida preventiva).
         */
        try {
            //Se ejecuta la consulta en la BD y se le pasa como parametro el id del proyecto
            const result = await this.pool.query(query, [idProyecto]);

            /**
             * Las filas resultantes son tuplas que tienen la informacion de la historia de usuario
             * y la informacion de uno de los criterios de aceptacion, donde el dato unico es el criterio
             * de aceptacion y la informacion de las historias de usuario puede repetirse.
             * Agrupamos las filas resultantes usando un objeto acumulador o Map
             * 
             */
            const mapHistorias = result.rows.reduce((acc, row) => {
                /*Si la historia aún no existe en el acumulador, la creamos como un objeto JavaScript y con
                * con un arreglo vacío para almacenar los criterios de aceptacion.
                */
                if (!acc[row.id]) {
                    acc[row.id] = {
                        id: row.id,
                        numeroDeHistoria: row.numero_de_historia,
                        nombre: row.nombre,
                        descripcion: row.descripcion,
                        valor: row.valor,
                        horas: row.horas_estimadas,
                        pendiente: row.pendiente,
                        asignado_al_sprint: row.asignado_al_sprint,
                        no_iteracion: row.no_iteracion,
                        estado: row.estado,
                        puntos_de_historia: row.puntos_de_historia,
                        epica_asignada: row.epica_asignada,                       
                        criterios: [] // Arreglo para los criterios de esta historia
                    };
                }
                // Solo agregamos el criterio si existe (evita añadir nulos por el LEFT JOIN)
                if (row.id_criterio !== null) {
                    acc[row.id].criterios.push({
                        id: row.id_criterio,
                        numero: row.numero_de_criterio,
                        criterio: row.criterios_de_aceptacion
                    });
                }

                return acc;
            }, {});

            // Convertimos el objeto acumulador de vuelta a un arreglo plano
            return Object.values(mapHistorias);

        } catch (error) {
            console.error('Error en el DAO al obtener las historias de usuario con criterios:', error);
            throw error;
        }
    }

    /**
     * Funcion que permite obtener una historia de un proyecto en especifico de la BD
     * @param {idHistoria} Int Id de la historia del proyecto
     * @param {idProyecto} Int 
     * @returns 
     */
    async obtenerHistoriaEnProyecto(idHistoria, idProyecto) {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.historia_de_usuario WHERE id = $1 AND id_Proyecto = $2;',
            [idHistoria, idProyecto]
        );
        return rows [0] || null;
    }

/**
     * Funcion para guardar una nueva historia de usuario con criterios de aceptacion en el sistema mediante una transaccion
     * @param {nombre} String Nombre de la historia de usuario
     * @param {descripcion} String Descripcion de la historia de usuario 
     * @param {criterios} Array Criterios de aceptacion de la historia de usuario 
     * @param {valor} Int Valor de la historia de usuario
     * @param {idEpica} Int Id de la epica asiganada a la historia
     * @param {puntos_de_historia} Int puntos de historia asignados a la historia. 
     * @param {idProyecto} Int Id del proyecto donde se agrega la historia de usuario 
     * @returns {respuesta} Respuesta de la transaccion
     */
    async agregarHistoria({nombre, descripcion, criterios, valor, horas, puntos_de_historia, puntosDeHistoria, idEpica, idProyecto}){
        //Encontrar un cliente exclusivo del pool de conexiones
        const client = await this.pool.connect();
        try {
            const rawPuntosAdd = puntos_de_historia ?? puntosDeHistoria ?? 0;
            const puntosFinalesAdd = Number.isInteger(Number(rawPuntosAdd)) && Number(rawPuntosAdd) >= 0 ? Number(rawPuntosAdd) : 0;

            //Empezar la transaccion
            await client.query('BEGIN');
            //Se preprara la linea de insercion de la historia
            const insercionHistoria = 
                `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, valor, horas_estimadas, puntos_de_historia, epica_asignada, id_proyecto) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
             `;
            //Ejecutamos la linea de inscercion
            const resultadoHistoria = await client.query(insercionHistoria, [nombre, descripcion, valor, horas, puntosFinalesAdd, idEpica, idProyecto]);
            //Recuperamos el id
            const idGenerado = resultadoHistoria.rows[0].id;
            //Se define la linea de insercion de los criterios d aceptacion
            const insercionCriterio = `INSERT INTO scrumbird.criterios_de_aceptacion (numero_de_criterio, criterios_de_aceptacion, id_historia, id_proyecto)
            VALUES ($1, $2, $3, $4);`;

            criterios.forEach((element, index) => {
                const resultadoCriterio = client.query(insercionCriterio, [index + 1, element.criterio, idGenerado, idProyecto])
            });
            await client.query('COMMIT');
            return { success: true, mensaje: "Datos guardados correctamente" };

        } catch (error) {
            //Revertir todos los cambios realizados si ocurre un eror en el bloque try
            await client.query('ROLLBACK');
            console.error("Error en el DAO al intentar guardar una nueva historia", error);
            throw error;
        } finally {
            //Liberar al cliente para devolverlo al pool de conexiones
            client.release();
        }
    }

    /**
     * Funcion que elimina una historia de usuario en el servidor utilizando su id
     * @param {idHistoria} Int Id de la historia a eliminar
     * @param {idProyecto} Int Id del proyecto a modificar 
     * @returns Mensaje ok
     */
    async eliminarHistoriaEnProyecto(idHistoria, idProyecto) {
        try{
            const resultado = await this.pool.query(
                `DELETE FROM scrumbird.historia_de_usuario WHERE id = $1 AND id_proyecto = $2;
                `,
                [idHistoria, idProyecto]
            );
            if(resultado.rowCount>0){
                return {
                    ok:true,
                    eliminado:true
                };
            }
        }catch(error){
            console.error("Error al borrar la historia de usuario en BD", error);
            throw error;
        }
    }

   /**
     * Metodo para modificar una historia de usuario y actualizar sus criterios de aceptacion mediante una transaccion
     * @param {number} idHistoria - Id de la historia de usuario a modificar
     * @param {number} idProyecto - Id del proyecto al que pertenece la historia
     * @param {Object} datos - Objeto con nombre, descripcion, criterios, valor y horas actualizadas
     * @returns {Promise<Object>} Objeto con estado ok y mensaje compatible con el controlador
     */
    async modificarHistoria(idHistoria, idProyecto, { nombre, descripcion, criterios, valor, horas, puntos_de_historia, puntosDeHistoria, idEpica }) {
        const client = await this.pool.connect();
        try {
            const rawPuntosMod = puntos_de_historia ?? puntosDeHistoria ?? 0;
            const puntosFinalesMod = Number.isInteger(Number(rawPuntosMod)) && Number(rawPuntosMod) >= 0 ? Number(rawPuntosMod) : 0;

            // Iniciar la transaccion
            await client.query('BEGIN');

            // 1. Actualizar los datos principales de la historia de usuario
            const actualizacionHistoria = `
                UPDATE scrumbird.historia_de_usuario 
                SET nombre = $1, 
                    descripcion = $2, 
                    valor = $3, 
                    horas_estimadas = $4,
                    puntos_de_historia = $5,
                    epica_asignada = $6
                WHERE id = $7 AND id_proyecto = $8;
            `;
            const resultadoHistoria = await client.query(actualizacionHistoria, [
                nombre,
                descripcion,
                valor,
                horas,
                puntosFinalesMod, 
                idEpica,
                idHistoria,
                idProyecto,
            ]);

            if (resultadoHistoria.rowCount === 0) {
                await client.query('ROLLBACK');
                return {
                    ok: false,
                    mensaje: "No se encontró la historia de usuario para modificar"
                };
            }

            // 2. Actualizar las tuplas de criterios de aceptacion
            // Eliminamos los criterios anteriores de esta historia para reinsertar los modificados en orden
            const eliminarCriteriosAnteriores = `
                DELETE FROM scrumbird.criterios_de_aceptacion 
                WHERE id_historia = $1 AND id_proyecto = $2;
            `;
            await client.query(eliminarCriteriosAnteriores, [idHistoria, idProyecto]);

            const insercionCriterio = `
                INSERT INTO scrumbird.criterios_de_aceptacion 
                (numero_de_criterio, criterios_de_aceptacion, id_historia, id_proyecto)
                VALUES ($1, $2, $3, $4);
            `;

            // Usamos for...of con await para garantizar que todas las inserciones terminen antes del COMMIT
            for (const [index, element] of criterios.entries()) {
                await client.query(insercionCriterio, [
                    index + 1,
                    element.criterio,
                    idHistoria,
                    idProyecto
                ]);
            }

            // Confirmar la transaccion
            await client.query('COMMIT');

            return {
                ok: true,
                mensaje: "Historia modificada correctamente"
            };

        } catch (error) {
            // Revertir todos los cambios si ocurre un error en cualquier paso
            await client.query('ROLLBACK');
            console.error("Error en el DAO al intentar modificar la historia de usuario", error);
            throw error;
        } finally {
            // Liberar al cliente de vuelta al pool de conexiones
            client.release();
        }
    }


    /**
     * Obtiene el detalle completo de todas las historias de usuario de un proyecto y sprint 
     * específicos mediante el procedimiento almacenado para el rol de facilitador y cliente.
     * 
     * @async
     * @function obtenerHistoriasKanvan
     * @param {number} idProyecto - Identificador único del proyecto.
     * @param {number} idSprint - Identificador único de la iteración o sprint actual.
     * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
     *                                   los detalles de las historias (estado, responsable, puntos, evidencias, etc.).
     * @throws {Error} Lanza un error si falla la consulta en la base de datos.
     */
    async obtenerHistoriasSprint(idProyecto, idSprint) {
        try {
            // Llamada al procedimiento almacenado del facilitador
            const query = 'SELECT * FROM scrumbird.sp_obtener_todas_historias_detalle($1, $2);';
            const { rows } = await this.pool.query(query, [idProyecto, idSprint]);
            return rows;
        } catch (error) {
            console.error("Error al obtener historias del sprint:", error);
            throw error;
        }
    }

    /**
     * Obtiene exclusivamente el detalle de las historias de usuario asignadas a un desarrollador 
     * en específico dentro de un proyecto y sprint determinados.
     * 
     * @async
     * @function obtenerHistoriasPorDesarrollador
     * @param {number} idProyecto - Identificador único del proyecto.
     * @param {number} idSprint - Identificador único de la iteración o sprint actual.
     * @param {number} idDesarrollador - Identificador único del usuario con rol de desarrollador.
     * @returns {Promise<Array<Object>>} Una promesa que resuelve con un arreglo de objetos que contienen 
     *                                   las historias asignadas al colaborador y sus respectivos detalles.
     * @throws {Error} Lanza un error si falla la consulta en la base de datos.
     */
    async obtenerHistoriasPorDesarrollador(idProyecto, idSprint, idDesarrollador) {
        try {
            // Llamada al procedimiento almacenado del desarrollador
            const query = 'SELECT * FROM scrumbird.sp_obtener_historias_por_desarrollador($1, $2, $3);';
            const { rows } = await this.pool.query(query, [idProyecto, idSprint, idDesarrollador]);
            return rows;
        } catch (error) {
            console.error("Error al obtener historias del desarrollador:", error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de una historia de usuario en la base de datos ejecutando 
     * el procedimiento almacenado correspondiente.
     * 
     * @async
     * @function actualizarEstadoHistoria
     * @param {number} idHistoria - Identificador único de la historia de usuario a actualizar.
     * @param {number} idProyecto - Identificador único del proyecto al que pertenece la historia.
     * @param {string} nuevoestado - Nuevo estado que se asignará a la historia (ej. 'En progreso', 'En revisión', 'Terminado').
     * @returns {Promise<Object>} Una promesa que resuelve con un objeto indicando el éxito de la operación y un mensaje.
     * @throws {Error} Lanza un error si falla la ejecución de la consulta en la base de datos.
     */
    async actualizarEstadoHistoria(
    idHistoria,
    idProyecto,
    nuevoEstado,
    horasReales = null
) {
    const requiereHoras = nuevoEstado === "en-revision";

    if (
        requiereHoras &&
        (
            typeof horasReales !== "number" ||
            !Number.isFinite(horasReales) ||
            horasReales < 0 ||
            horasReales > 99999999.99 ||
            Math.abs(
                horasReales * 100 - Math.round(horasReales * 100)
            ) > 0.000001
        )
    ) {
        const error = new Error(
            "Ingresa las horas reales totales con máximo dos decimales."
        );
        error.status = 400;
        throw error;
    }

    const cliente = await this.pool.connect();

    try {
        await cliente.query("BEGIN");
        // Evitar mediciones inconsistentes si cambian varias historias a la vez.
        await cliente.query(
            `SELECT id
            FROM scrumbird.proyecto
            WHERE id = $1
            FOR UPDATE`,
            [idProyecto]
        );

        const historia = await cliente.query(
            `SELECT id
             FROM scrumbird.historia_de_usuario
             WHERE id = $1 AND id_proyecto = $2
             FOR UPDATE`,
            [idHistoria, idProyecto]
        );

        if (historia.rows.length === 0) {
            const error = new Error(
                "La historia no pertenece al proyecto indicado."
            );
            error.status = 404;
            throw error;
        }

        await cliente.query(
            "CALL scrumbird.sp_actualizar_estado_historia($1, $2, $3)",
            [idHistoria, idProyecto, nuevoEstado]
        );

        if (requiereHoras) {
            await cliente.query(
                `UPDATE scrumbird.historia_de_usuario
                 SET horas_reales = $1
                 WHERE id = $2 AND id_proyecto = $3`,
                [horasReales, idHistoria, idProyecto]
            );
        }
        // Medición del día: sumar estimaciones de historias aún no terminadas.
            await cliente.query(
                `WITH sprint_actual AS (
                    SELECT s.id
                    FROM scrumbird.sprint s
                    JOIN scrumbird.historia_de_usuario h
                    ON h.asignado_al_sprint = s.id
                    AND h.id_proyecto = s.id_proyecto
                    WHERE h.id = $1
                    AND s.id_proyecto = $2
                    AND (CURRENT_TIMESTAMP AT TIME ZONE 'America/Mexico_City')::date
                        BETWEEN s.fecha_inicio AND s.fecha_fin
                ),
                pendientes AS (
                    SELECT h.horas_calculadas, h.puntos_de_historia
                    FROM scrumbird.historia_de_usuario h
                    JOIN sprint_actual s ON s.id = h.asignado_al_sprint
                    WHERE h.id_proyecto = $2
                    AND NOT (
                        EXISTS (
                            SELECT 1
                            FROM scrumbird.trabajando_en_historia t
                            WHERE t.historia_asignada = h.id
                                AND t.id_proyecto = h.id_proyecto
                                AND t.estado = 'terminado'
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM scrumbird.trabajando_en_historia t
                            WHERE t.historia_asignada = h.id
                                AND t.id_proyecto = h.id_proyecto
                                AND t.estado IS DISTINCT FROM 'terminado'
                        )
                    )
                )
                INSERT INTO scrumbird.burndown_diario (
                    id_sprint,
                    fecha,
                    horas_restantes,
                    puntos_restantes,
                    es_prueba
                )
                SELECT
                    s.id,
                    (CURRENT_TIMESTAMP AT TIME ZONE 'America/Mexico_City')::date,
                    COALESCE((SELECT SUM(horas_calculadas) FROM pendientes), 0),
                    COALESCE((SELECT SUM(puntos_de_historia) FROM pendientes), 0),
                    false
                FROM sprint_actual s
                ON CONFLICT (id_sprint, fecha)
                DO UPDATE SET
                    horas_restantes = EXCLUDED.horas_restantes,
                    puntos_restantes = EXCLUDED.puntos_restantes,
                    es_prueba = false`,
                [idHistoria, idProyecto]
            );
        await cliente.query("COMMIT");

        return {
            success: true,
            message: "Estado actualizado correctamente"
        };
    } catch (error) {
        await cliente.query("ROLLBACK");
        throw error;
    } finally {
        cliente.release();
    }
}

    async actualizarEstimacionHistoria(idHistoria, { puntos, horas }) {
    await this.pool.query(
        `UPDATE scrumbird.historia_de_usuario
            SET puntos_de_historia = $1,
                horas_estimadas = $2
          WHERE id = $3`,
        [puntos, horas, idHistoria]
    );
}


}

module.exports = historiaUsuarioDAO;