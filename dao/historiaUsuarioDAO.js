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
     * cRITERIOS DE ACEPTACION, IdHistoria (IdProyecto)
     */
    async obtenerHistorias(idProyecto) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, descripcion, valor, asignado_al_sprint FROM scrumbird.historia_de_usuario WHERE id_proyecto = $1 ORDER BY id;'
            , [idProyecto],
            'SELECT id, numero_de_criterio, criterios_de_aceptacion, '
        );
        return rows;
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
                t_historias.nombre, 
                t_historias.descripcion, 
                t_historias.valor, 
                t_historias.asignado_al_sprint, 
                t_criterios.id AS id_criterio, 
                t_criterios.numero_de_criterio, 
                t_criterios.criterios_de_aceptacion
            FROM 
                scrumbird.historia_de_usuario t_historias
            LEFT JOIN 
                scrumbird.criterios_de_aceptacion t_criterios 
                ON t_historias.id = t_criterios.id_historia 
                AND t_historias.id_proyecto = t_criterios.id_proyecto
            WHERE 
                t_historias.id_proyecto = $1;
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
                        nombre: row.nombre,
                        descripcion: row.descripcion,
                        valor: row.valor,
                        asignado_al_sprint: row.asignado_al_sprint,
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
     * Funcion para guardar una nueva historia de usuario con criterios de aceptacion en el sistema mediante una transaccion
     * @param {nombre} String Nombre de la historia de usuario
     * @param {descripcion} String Descripcion de la historia de usuario 
     * @param {criterios} Array Criterios de aceptacion de la historia de usuario 
     * @param {valor} Int Valor de la historia de usuario
     * @param {idProyecto} Int Id del proyecto donde se agrega la historia de usuario  
     * @returns {respuesta} Respuesta de la transaccion
     */
    async agregarHistoria({nombre, descripcion, criterios, valor, idProyecto }){
        //Encontrar un cliente exclusivo del pool de conexiones
        const client = await this.pool.connect();
        try {
            //Empezar la transaccion
            await client.query('BEGIN');
            const insercionHistoria = 
                `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, valor, id_proyecto) 
                VALUES ($1, $2, $3, $4)
                RETURNING id;
             `;
            const resultadoHistoria = await client.query(insercionHistoria, [nombre, descripcion, valor, idProyecto]);
            const idGenerado = resultadoHistoria.rows[0].id;

            const insercionCriterio = `INSERT INTO scrumbird.criterios_de_aceptacion (numero_de_criterio, criterios_de_aceptacion, id_historia, id_proyecto)
            VALUES ($1, $2, $3, $4);`;
            let numeroCriteriosInsertados;
            criterios.forEach((element, index) => {
            const resultadoCriterio = client.query(insercionCriterio, [index+1, element.criterio, idGenerado, idProyecto])  
            });
            await client.query('COMMIT');
            return {success: true, mensaje:"Datos guardados correctamente"};

        } catch (error) {
            //Revertir todos los cambios realizados si ocurre un eror en el bloque try
            await client.query('ROLLBACK');
            console.error("Error en el DAO al intentar guardar una nueva historia", error);
            throw error;
        } finally{
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
    async eliminarHistoriaDao({idHistoria, idProyecto}) {
        try{
            const { rows } = await this.pool.query(
                `DELETE FROM scrumbird.historia_de_usuario WHERE id = $1 AND id_proyecto = $2;
                `,
                [idHistoria, idProyecto]
            );
            return {
                ok:true,
                eliminado:true
            };
        }catch(error){
            console.error("Error al borrar la historia de usuario en BD", error);
            throw error;
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


}

module.exports = historiaUsuarioDAO;