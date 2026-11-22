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
     * @param {idProyecto} Int Id del proyecto donde se agrega la historia de usuario  
     * @returns {respuesta} Respuesta de la transaccion
     */
    async agregarHistoria({nombre, descripcion, criterios, valor, horas, idProyecto }){
        //Encontrar un cliente exclusivo del pool de conexiones
        const client = await this.pool.connect();
        try {
            //Empezar la transaccion
            await client.query('BEGIN');
            const insercionHistoria = 
                `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, valor, horas_estimadas, id_proyecto) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id;
             `;
            const resultadoHistoria = await client.query(insercionHistoria, [nombre, descripcion, valor, horas, idProyecto]);
            const idGenerado = resultadoHistoria.rows[0].id;

            const insercionCriterio = `INSERT INTO scrumbird.criterios_de_aceptacion (numero_de_criterio, criterios_de_aceptacion, id_historia, id_proyecto)
            VALUES ($1, $2, $3, $4);`;
            let numeroCriteriosInsertados;
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
    async modificarHistoria(idHistoria, idProyecto, { nombre, descripcion, criterios, valor, horas }) {
        const client = await this.pool.connect();
        try {
            // Iniciar la transaccion
            await client.query('BEGIN');

            // 1. Actualizar los datos principales de la historia de usuario
            const actualizacionHistoria = `
                UPDATE scrumbird.historia_de_usuario 
                SET nombre = $1, 
                    descripcion = $2, 
                    valor = $3, 
                    horas_estimadas = $4
                WHERE id = $5 AND id_proyecto = $6;
            `;
            const resultadoHistoria = await client.query(actualizacionHistoria, [
                nombre,
                descripcion,
                valor,
                horas,
                idHistoria,
                idProyecto
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
    async actualizarEstadoHistoria(idHistoria, idProyecto, nuevoEstado) {
        try {
            const query = 'CALL scrumbird.sp_actualizar_estado_historia($1, $2, $3);';
            await this.pool.query(query, [idHistoria, idProyecto, nuevoEstado]);
            return { success: true, message: "Estado actualizado correctamente" };
        } catch (error) {
            console.error("Error al actualizar el estado de la historia:", error);
            throw error;
        }
    }

    /**
     * Actualiza las horas_estimadas de una historia de usuario en la base de datos
     * 
     * @async
     * @function actualizarPuntosHistoria
     * @param {number} idHistoria - Identificador único de la historia de usuario a actualizar.
     * @param {number} horas_estimadas - Horas estimadas para asignar a la historia.
     * @returns {Promise<Object>} Una promesa que resuelve con un objeto indicando el éxito de la operación y un mensaje.
     * @throws {Error} Lanza un error si falla la ejecución de la consulta en la base de datos.
     */
    async actualizarPuntosHistoria(idHistoria, horas_estimadas) {
        try {
            const query = 'UPDATE scrumbird.historia_de_usuario SET horas_estimadas = $2 WHERE id = $1;';
            await this.pool.query(query, [idHistoria, horas_estimadas]);
            return { success: true, message: "Horas asignadas correctamente" };
        } catch (error) {
            console.error("Error al actualizar las horas estimadas de la historia:", error);
            throw error;
        }
    }


}

module.exports = historiaUsuarioDAO;