class epicasControlador {
    constructor(epicasDAO) {
        this.dao = epicasDAO;
    }

    /**
     * Funcion para obtener todas las epicas de un proyecto
     * @param {*} req 
     * @param {*} res 
     * @returns Respuesta con arreglo de objetos epica
     */
    async obtenerEpicasEnProyecto(req, res) {
        try {
            // Se recupera el id del proyecto de los request paramas
            const idProyecto = Number(req.params.idProyecto);
            // Se valida que no sea null y que sea un entero
            if (!idProyecto || !Number.isInteger(idProyecto)) {
                return res.status(404).json({ ok: false, mensaje: "Error: el proyecto no pudo ser encontrado" });
            }
            // Se obtiene el arreglo de epicas del proyecto
            const epicas = await this.dao.obtenerEpicasEnProyecto(idProyecto);
            // Se regresa una respuesta
            return res.status(200).json({ ok: true, mensaje: "Épicas del proyecto recuperadas correctamente", data: epicas });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion para obtener una epica en un proyecto
     * @param {*} req 
     * @param {*} res 
     * @returns Respuesta con objeto epica encontrado
     */
    async obtenerEpicaEnProyecto(req, res) {
        try {
            //Se recupera el id de la epica del request params
            const idEpica = Number(req.params.idEpica);
            // Se recupera el id del proyecto del request params
            const idProyecto = Number(req.params.idProyecto);
            // Validaciones de valor null y entero sobre los datos recuperados
            if (!idEpica || !Number.isInteger(idEpica)) {
                return res.status(404).json({ ok: false, mensaje: "Error: el id de la épica no es válido" });
            }
            if (!idProyecto || !Number.isInteger(idProyecto)) {
                return res.status(404).json({ ok: false, mensaje: "Error: el id del proyecto no es válido" });
            }
            // Se obtiene el objeto epica del DAO
            const epica = await this.dao.obtenerEpicaEnProyecto(idEpica, idProyecto);
            if (!epica) {
                return res.status(404).json({ ok: false, mensaje: "La épica no existe en el proyecto" });
            }
            return res.status(200).json({ ok: true, mensaje: "Épica recuperada correctamente", data: epica });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion para agregar una epica a un proyecto
     * @param {*} req 
     * @param {*} res 
     * @returns Respuesta de confirmacion
     */
    async agregarEpicaEnProyecto(req, res) {
        try {
            // Se recupera el nombre del cuerpo de la solicitud
            const nombre = typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";
            // Se recupera el id del proyecto del cuerpo de la solicitud
            const idProyecto = Number(req.body.idProyecto || req.params.idProyecto);
            // Se validan los datos del proyecto
            if (!idProyecto || !Number.isInteger(idProyecto)) {
                return res.status(404).json({ ok: false, mensaje: "Error: no se pudo encontrar el proyecto" });
            }
            // Se valida el nombre
            if (!nombre || nombre.length === 0) {
                return res.status(400).json({ ok: false, mensaje: "El nombre de la épica es obligatorio" });
            }

            const duplicadaAdd = await this.dao.existeEpicaConNombreEnProyecto(nombre, idProyecto);
            if (duplicadaAdd) {
                return res.status(409).json({
                    ok: false,
                    mensaje: "Ya existe una épica con ese nombre en este proyecto."
                });
}
            // Se agrega la epica a la BD
            const resultado = await this.dao.agregarEpica({ nombre, idProyecto });
            // Se regresa una respuesta de confirmacion
            return res.status(201).json({ ok: true, mensaje: resultado.mensaje || "Épica agregada correctamente", data: resultado.data });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion para eliminar una epica de un proyecto
     * @param {*} req 
     * @param {*} res 
     * @returns Mensaje de confirmacion
     */
    async eliminarEpicaEnProyecto(req, res) {
        try {
            // Se recupera el id de la epica y el id del proyecto de los request Params
            const idEpica = Number(req.params.idEpica);
            const idProyecto = Number(req.params.idProyecto);
            // Se validan los datos
            if (!idEpica || !Number.isInteger(idEpica)) {
                return res.status(404).json({ ok: false, mensaje: "Error: el id de la épica no es válido" });
            }
            if (!idProyecto || !Number.isInteger(idProyecto)) {
                return res.status(404).json({ ok: false, mensaje: "Error: no se pudo encontrar el proyecto" });
            }
            // Se busca la epica en la BD y si no se encuentra se manda un mensaje de error
            const epicaExistente = await this.dao.obtenerEpicaEnProyecto(idEpica, idProyecto);
            if (!epicaExistente) {
                return res.status(404).json({ ok: false, mensaje: "La épica no existe en la BD" });
            }
            // Si se encuentra la epica entonces se elimina de la BD y se envia un
            const resultado = await this.dao.eliminarEpica(idEpica, idProyecto);
            if (resultado && resultado.ok) {
                return res.status(200).json({ ok: true, mensaje: resultado.mensaje || "Épica eliminada correctamente" });
            }
            // Si ocurre algun error se envia el mensaje correspondiente
            return res.status(400).json({ ok: false, mensaje: "La épica no pudo ser eliminada" });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion para modificar una epica en un proyecto
     * @param {*} req 
     * @param {*} res 
     * @returns Respuesta de confirmacion
     */
    async modificarEpicaEnProyecto(req, res) {
        try {
            //Se recupera la informacion del cuerpo correspondiente
            const idEpica = Number(req.params.idEpica);
            const idProyecto = Number(req.params.idProyecto);
            const nombre = typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";
            // Se realizan todas las verificaciones correspondientes
            if (!idEpica || !Number.isInteger(idEpica)) {
                return res.status(404).json({ ok: false, mensaje: "Error: el id de la épica no es válido" });
            }
            if (!idProyecto || !Number.isInteger(idProyecto)) {
                return res.status(404).json({ ok: false, mensaje: "Error: no se pudo encontrar el proyecto" });
            }
            if (!nombre || nombre.length === 0) {
                return res.status(400).json({ ok: false, mensaje: "El nombre de la épica es obligatorio" });
            }
            const epicaExistente = await this.dao.obtenerEpicaEnProyecto(idEpica, idProyecto);
            if (!epicaExistente) {
                return res.status(404).json({ ok: false, mensaje: "La épica no existe en la BD" });
            }

            const duplicadaMod = await this.dao.existeEpicaConNombreEnProyecto(nombre, idProyecto, idEpica);
            if (duplicadaMod) {
                return res.status(409).json({
                    ok: false,
                    mensaje: "Ya existe otra épica con ese nombre en este proyecto."
                });
            }
            // Se modifica la epica en la BD y se recupera la respuesta
            const resultado = await this.dao.modificarEpica(idEpica, idProyecto, { nombre });
            if (resultado && resultado.ok) {
                // Si todo salio bien entonces se envia la respuesta al cliente
                return res.status(200).json({ ok: true, mensaje: resultado.mensaje || "Épica modificada correctamente", data: resultado.data });
            }
            return res.status(400).json({ ok: false, mensaje: "La épica no pudo ser modificada" });
        } catch (err) {
            this.#error(res, err);
        }
    }

    #error(res, err) {
        console.error('Error en epicasControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = epicasControlador;