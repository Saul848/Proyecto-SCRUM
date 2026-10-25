/**
 * Controlador de Historias de Usuario: valida la entrada, aplica reglas y responde HTTP
 * @module historiaUsuarioControlador
 */
const MAX = { titulo: 100, descripcion: 500, criterios: 500 };

class historiaUsuarioControlador {
    constructor(historiaUsuarioDAO) {
        this.dao = historiaUsuarioDAO;
    }

    // GET /historias
    async listar(req, res) {
        try {
            const historias = await this.dao.obtenerHistorias();
            res.json({ data: historias });
        } catch (err) {
            this.#error(res, err);
        }
    }

    // POST /historias  body: { titulo, descripcion, criterios, valor, sprintAsig }
    async agregar(req, res) {
        const { nombre, descripcion, criterios, valor, sprint} = req.body;
        try {
            const historiaCreada = await this.dao.agregarHistoria(req.body);
            res.status(201).json(historiaCreada);
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Endpoint / GET /historias/kanban
     * Obtiene y responde en formato JSON todas las historias del sprint actual 
     * para la vista global del facilitador.
     * 
     * @async
     * @function obtenerHistoriasSprint
     * @param {Object} req - Objeto de solicitud HTTP (Express). Espera parámetros de consulta (`query`) o de ruta (`params`) `idProyecto` e `idSprint`.
     * @param {Object} res - Objeto de respuesta HTTP (Express).
     * @returns {Promise<void>} Responde con un objeto JSON estructurado con la propiedad `success: true` y el arreglo `data` de historias.
     */
    async obtenerHistoriasSprint(req, res) {
        try {
            const { idProyecto, idSprint } = req.params; 
            
            const historias = await this.dao.obtenerHistoriasSprint(idProyecto, idSprint);
            res.json({ success: true, data: historias });
        } catch (err) {
            console.log("Error en sprint kanvan general");
            this.#error(res, err);
        }
    }

    /**
     * Endpoint / GET /historias/desarrollador
     * Obtiene y responde en formato JSON únicamente las historias de usuario asignadas 
     * a un desarrollador específico dentro del sprint.
     * 
     * @async
     * @function obtenerHistoriasPorDesarrollador
     * @param {Object} req - Objeto de solicitud HTTP (Express). Espera `idProyecto`, `idSprint` e `idDesarrollador`.
     * @param {Object} res - Objeto de respuesta HTTP (Express).
     * @returns {Promise<void>} Responde con un objeto JSON con la propiedad `success: true` y el arreglo `data` correspondiente al desarrollador.
     */
    async obtenerHistoriasPorDesarrollador(req, res) {
        try {
            const { idProyecto, idSprint, idDesarrollador } = req.params;
            
            const historias = await this.dao.obtenerHistoriasPorDesarrollador(idProyecto, idSprint, idDesarrollador);
            res.json({ success: true, data: historias });
        } catch (err) {
            console.log("Error en sprint kanvan DEV");
            this.#error(res, err);
        }
    }

    /**
     * Actualiza el estado de una historia de usuario dentro de un proyecto.
     *
     * @async
     * @function actualizarEstadoHistoria
     * @param {Object} req - Objeto de solicitud HTTP de Express.
     * @param {Object} res - Objeto de respuesta HTTP de Express.
     * @returns {Promise<void>} Responde con un JSON indicando si se actualizó el estado.
     */
    async actualizarEstadoHistoria(req, res) {
        try {
            const { idHistoria, idProyecto} = req.params;

            const { nuevoEstado } = req.body;

            const resultado = await this.dao.actualizarEstadoHistoria(idHistoria, idProyecto, nuevoEstado);

            res.json(resultado);
        } catch (err) {
            console.log("Error al actualizar el estado de la historia");
            this.#error(res, err);
        }
    }

    #error(res, err) {
        console.error('Error en historiaUsuarioControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = historiaUsuarioControlador;