const fs = require('fs');
const path = require('path');

/**
 * Controlador de Sprints: valida la entrada, aplica reglas y responde HTTP
 * @module sprintControlador
 */
class sprintControlador {
    constructor(sprintDAO) {
        this.dao = sprintDAO;
    }

    /**
     * Función que procesa la solicitud para obtener los sprints asociados a un proyecto
     * @param {*} req Request Param id del proyecto en forma de número
     * @param {*} res Respuesta con estado ok, mensaje y datos de los sprints
     * @returns
     */
    async listarSprintsPorProyecto(req, res) {
        try {
            const idProyecto = Number(req.params.idProyecto);
            
            // Verificamos que el dato enviado tenga un valor y que sea Entero
            if (Number.isNaN(idProyecto)) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el Proyecto no pudo ser encontrado"
                });
            }

            const sprints = await this.dao.obtenerSprints(idProyecto);
            if (sprints) {
                res.status(201).json({
                    ok: true,
                    mensaje: "Sprints del proyecto recuperados correctamente",
                    data: sprints
                });
            }
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Método que procesa la solicitud para agregar un nuevo sprint
     * @param {*} req Body con la información básica para agregar un nuevo sprint
     * @param {*} res Estado ok y mensaje
     * @returns
     */
    async agregarSprint(req, res) {
        const { no_iteracion, objetivo, fecha_inicio, fecha_fin, idProyecto, historias } = req.body;
        try {
            // Se verifica que ninguno de los datos obligatorios esté vacío
            if (!no_iteracion || !objetivo || !fecha_inicio || !fecha_fin || !idProyecto) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Todos los datos del formulario son obligatorios"
                });
            }

            // Se verifica que el número de iteración sea numérico y se encuentre en el rango de 1 a 100
            const iteracionNum = Number(no_iteracion);
            if (isNaN(iteracionNum) || iteracionNum < 1 || iteracionNum > 100) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El número de iteración debe ser un valor entero entre 1 y 100"
                });
            }

            // Fase de inserción en la BD
            const sprintCreado = await this.dao.agregarSprint(req.body);
            
            res.status(201).json({
                ok: true,
                    mensaje: "Sprint agregado correctamente",
                data: sprintCreado
            });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Método que procesa la solicitud para modificar un sprint existente
     * @param {*} req Params con idSprint y Body con los datos actualizados
     * @param {*} res Estado ok y mensaje
     * @returns
     */
    async modificarSprint(req, res) {
        try {
            const { idSprint, idProyecto } = req.params;
            const { no_iteracion, objetivo, fecha_inicio, fecha_fin, historias } = req.body;

            const idSprintNum = Number(idSprint);
            const idProyectoNum = Number(idProyecto);

            // Verificamos si los IDs proporcionados son válidos
            if (!idSprintNum || !Number.isInteger(idSprintNum)) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el id del sprint no es válido"
                });
            }

            if (!idProyectoNum || !Number.isInteger(idProyectoNum)) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error no pudo encontrarse el proyecto del sprint a modificar"
                });
            }

            // Se verifica que los campos obligatorios vengan informados
            if (!no_iteracion || !objetivo || !fecha_inicio || !fecha_fin) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Todos los datos del formulario son obligatorios"
                });
            }

            const iteracionNum = Number(no_iteracion);
            if (isNaN(iteracionNum) || iteracionNum < 1 || iteracionNum > 100) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El número de iteración debe ser un valor entero entre 1 y 100"
                });
            }

            // Verificamos si el sprint existe antes de modificarlo
            const sprintExistente = await this.dao.obtenerSprintPorId(idSprintNum, idProyectoNum);
            if (sprintExistente) {
                const sprintModificado = await this.dao.modificarSprint(idSprintNum, idProyectoNum, req.body);
                
                return res.status(200).json({
                    ok: true,
                    mensaje: "Sprint modificado correctamente",
                    data: sprintModificado
                });
            } else {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El sprint no existe en la BD"
                });
            }
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Función para eliminar sprints de la BD
     * @param {*} req Request Params con el id del sprint y del proyecto
     * @param {*} res Código de respuesta
     * @returns 
     */
    async eliminarSprint(req, res) {
        try {
            const { idSprint, idProyecto } = req.params;

            const idSprintNum = Number(idSprint);
            const idProyectoNum = Number(idProyecto);

            // Verificamos la validez de los parámetros
            if (!idSprintNum || !Number.isInteger(idSprintNum)) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el id del sprint no es válido"
                });
            }

            if (!idProyectoNum || !Number.isInteger(idProyectoNum)) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error no pudo encontrarse el proyecto del sprint a eliminar"
                });
            }

            // Verificamos si el sprint existe en la base de datos
            const sprintExistente = await this.dao.obtenerSprintPorId(idSprintNum, idProyectoNum);
            if (sprintExistente) {
                const sprintEliminado = await this.dao.eliminarSprint(idSprintNum, idProyectoNum);
                
                if (sprintEliminado.ok || sprintEliminado) {
                    return res.status(200).json({
                        ok: true,
                        mensaje: "Sprint eliminado correctamente"
                    });
                } else {
                    return res.status(400).json({
                        ok: false,
                        mensaje: "El sprint no pudo ser eliminado"
                    });
                }
            } else {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El sprint no existe en la BD"
                });
            }
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Método privado para la gestión centralizada de errores
     * @param {*} res 
     * @param {*} err 
     */
    #error(res, err) {
        console.error('Error en sprintControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = sprintControlador;