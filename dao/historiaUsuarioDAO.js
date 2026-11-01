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
 * @param {Object} pool - Pool de conexiones a la base de datos (pg)
 * @returns {Promise<Array>} Arreglo de historias de usuario con sus criterios anidados
 */
    async obtenerHistoriasEnProyecto(idProyecto) {
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
                historia_de_usuario t_historias, 
                criterios_de_aceptacion t_criterios
            WHERE 
                t_historias.id_proyecto = t_criterios.id_proyecto 
                AND t_historias.id = t_criterios.id_historia AND
                t_historias.id_proyecto =$1 AND t_criterios.id_proyecto= $1
                ;
        `
        try {
            const result = await this.pool.query(query, [idProyecto]);

            // Agrupamos las filas usando un objeto acumulador o Map
            const mapHistorias = result.rows.reduce((acc, row) => {
                // Si la historia aún no existe en el acumulador, la creamos con un arreglo vacío
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

                // Agregamos el criterio actual al arreglo de la historia correspondiente
                acc[row.id].criterios.push({
                    id: row.id_criterio,
                    numero: row.numero_de_criterio,
                    criterio: row.criterios_de_aceptacion
                });

                return acc;
            }, {});

            // Convertimos el objeto acumulador de vuelta a un arreglo plano
            return Object.values(mapHistorias);

        } catch (error) {
            console.error('Error en el DAO al agrupar historias con criterios:', error);
            throw error;
        }
    }

    async agregarHistoria({nombre, descripcion, criterios, valor, sprint }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, criterios_de_aceptacion, valor, asignado_al_sprint) 
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, id_proyecto
             `,
            [nombre, descripcion, criterios, valor, sprint]
        );
        return rows;
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