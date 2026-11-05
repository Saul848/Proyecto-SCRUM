const fs = require('fs');
const path = require('path');

const { crearCarpetaHistoria } = require('../utils/fileSystemHelper'); // <-- Importar helper

/**
 * Controlador de Historias de Usuario: valida la entrada, aplica reglas y responde HTTP
 * @module historiaUsuarioControlador
 */
const MAX = { titulo: 100, descripcion: 500, criterios: 500 };

class historiaUsuarioControlador {
    constructor(historiaUsuarioDAO) {
        this.dao = historiaUsuarioDAO;
    }
    /**
     * Funcion que envia al cliente todas las historias de usuarios en la BD, se ejecuta con el verbo GET y la url /historias
     * @param {*} req 
     * @param {*} res 
     */
    async listar(req, res) {
        try {
            const historias = await this.dao.obtenerHistorias();
            res.status(201).json({ data: historias });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion que procesa la solicitud para obtener las historias de usuario de un proyecto
     * con la informacion para mostrarlas en un proyecto.
     * @param {*} req Request Param id del proyecto en forma de numero
     * @param {*} res respuesta con estado ok, mensaje y datos de las historias
     * @returns
     */
    async listarHistoriasPorProyecto(req, res){
        try {
            //Se obtiene el id del proyecto en el que se encuentra el usuario
            const idProyecto = Number(req.params.idProyecto);
            console.log(req.params)
            //Verificamos que el dato enviado tenga un valor y que sea Entero
            if(Number.isNaN(idProyecto)){
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el Proyecto no pudo ser encontrado"
                })
            }
            const historias = await this.dao.obtenerHistoriasEnProyecto(idProyecto);
            if (historias){
                res.status(201).json({
                    ok:true,
                    mensaje: "Historias del proyecto recuperadas correctamente",
                    data: historias
                })
            }

        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Metodo que procesa la solicitud para agregar una nueva histora
     * @param {*} req Body con la informacion basica para agregar una nueva historia de usuario
     * @param {*} res estado ok y mensaje
     * @returns
     */
    async agregarHistoria(req, res) {
        const { nombre, descripcion, criterios, valor, idProyecto} = req.body;
        try {
            // Se verifica que ninguno de los datos este vacio
            if (!nombre || !descripcion || !criterios || valor === undefined || valor === null || !idProyecto) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Todos los datos del formulario son obligatorios"
                });
            }
            // Se verifica que el arreglo de criterios tenga almenos un criterio de aceptacion
            if (criterios.length <= 0 ) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "No se han registrado criterios de aceptacion para la historia"
                })
            }
            // Se verifica que el valor sea un numero
            if (isNaN(valor) || typeof valor !== 'number') {
                return res.status(404).json({
                    ok: false,
                    mensaje: "El valor enviado para la historia no es numerico"
                })       
            }
            // Se verifica que el valor este dentro del rango estimado
            if(valor < 0 || valor > 4000){
                return res.status(404).json({
                    ok: false,
                    mensaje: "El valor especificado para la historia no esta dentro del rango establecido"
            })
            }

        //Fase de insercion
            const historiaCreada = await this.dao.agregarHistoria(req.body);
            // Creacion de carpeta de evidencias
            const idHistoria = historiaCreada.id;
            const proyectoId = historiaCreada.id_proyecto
            // 2. Crear físicamente la carpeta de evidencias para esta historia: evidencias/idProyecto/idHistoria
            if (proyectoId && idHistoria) {
                crearCarpetaHistoria(proyectoId, idHistoria);
            }
            res.status(201).json({
                ok:true,
                mensaje:"Historia agregada correctamente"
            });
        } catch (err) {
            this.#error(res, err);
        }
    }

    /**
     * Funcion para eliminar historias de la BD
     * @param {*} req Request Params con el id de la historia y del proyecto
     * @param {*} res Codigo de respuesta
     * @returns 
     */
    async eliminarHistoriaEnProyecto(req, res) {
        try {
            const { idHistoria, idProyecto } = req.params;
            //Si mi id no tiene valor o si no es un entero regreso la respuesta correspondiente
            if(!idHistoria || !Number.isInteger(idHistoria)){
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el id de la historia no es valido"
                })
            }
            //Si mi idProyecto no tiene valor o si no es un entero regreso la respuesta correspondiente
            if(!idProyecto || !Number.isInteger(idProyecto)){
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error no puedo encontrarse el proyecto de la historia a eliminar"
                })
            }
            //Verificamos si la historia existe en la base de datos
            const historiaExistente = await this.dao.obtenerHistoriaEnProyecto(idHistoria, idProyecto);
            if(historiaExistente && historiaExistente.id === id){
                //Eliminamos la historia de la base de datos y verificamos su respuesta
                const historiaEliminada = await this.dao.eliminarHistoriaEnProyecto(idHistoria, idProyecto);
                //Si la historia fue eliminada con exito enviamos la respuesta correspondiente
                if(historiaEliminada.ok){
                    return res.status(201).json({
                        ok: true,
                        mensaje: "Historia eliminada correctamente"
                    })
                //Si la historia no pudo ser eliminada se envia el mensaje correspondiente
                }else{
                    return res.status(400).json({
                        ok: false,
                        mensaje: "La historia no pudo ser eliminada"
                    })
                }
            //Si la historia no existe se envia el mensaje correspondiente
            }else{
                return res.status(404).json({
                    ok:false,
                    mensaje: "La historia no existe en la BD"
                })
            }
        } catch (error) {
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
            const { idHistoria, idProyecto } = req.params;

            const { nuevoEstado } = req.body;

            const resultado = await this.dao.actualizarEstadoHistoria(idHistoria, idProyecto, nuevoEstado);

            res.json(resultado);
        } catch (err) {
            console.log("Error al actualizar el estado de la historia");
            this.#error(res, err);
        }
    }

    async obtenerEvidenciasHistoria(req, res) {
        try {
            const { idProyecto, idHistoria } = req.params;

            // Ruta absoluta segura: /proyecto/evidencias/idProyecto/idHistoria
            const carpetaRuta = path.join(__dirname, '../public/evidencias', String(idProyecto), String(idHistoria));

            // Si la carpeta física aún no existe, devolvemos un arreglo vacío
            if (!fs.existsSync(carpetaRuta)) {
                return res.status(200).json({ ok: true, data: [] });
            }

            // Leer los archivos dentro del directorio
            const archivosNombres = fs.readdirSync(carpetaRuta);

            const archivos = archivosNombres.map((nombreArchivo, index) => {
                const rutaUrlPublica = `/evidencias/${idProyecto}/${idHistoria}/${nombreArchivo}`;

                return {
                    id: index + 1,
                    nombre: nombreArchivo,
                    url: rutaUrlPublica,
                    id_usuario_subio: 1, // Ajusta según tu lógica de BD
                    nombre_usuario: "Desarrollador",
                    fecha: "Reciente"
                };
            });

            res.status(200).json({ ok: true, data: archivos });
        } catch (err) {
            console.error("Error al obtener evidencias por ID:", err);
            res.status(500).json({ ok: false, mensaje: "Error al listar las evidencias" });
        }
    }


    async guardarEvidenciaHistoria(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "No se recibió ningún archivo."
                });
            }

            return res.status(201).json({
                ok: true,
                mensaje: "Evidencia subida correctamente.",
                data: {
                    nombre: req.file.filename,
                    url: `/evidencias/${req.params.idProyecto}/${req.params.idHistoria}/${req.file.filename}`
                }
            });
        } catch (err) {
            console.error("Error al guardar evidencia:", err);

            return res.status(500).json({
                ok: false,
                mensaje: "Error al guardar la evidencia."
            });
        }
    }

    /**
     * Elimina una evidencia del servidor.
     */
    async borrarEvidenciaHistoria(req, res) {
        try {
            const { idProyecto, idHistoria, nombreArchivo } = req.params;

            // Validación de seguridad: evitar nombres inválidos o rutas manipuladas y permitir PNG, JPG, PDF y ZIP
            if (
                !nombreArchivo ||
                nombreArchivo !== path.basename(nombreArchivo) ||
                !/\.(png|jpe?g|pdf|zip)$/i.test(nombreArchivo)
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Nombre o formato de archivo no válido."
                });
            }

            // Construir la ruta de la carpeta de evidencias.
            const carpetaRuta = path.resolve(
                __dirname,
                "../public/evidencias",
                String(idProyecto),
                String(idHistoria)
            );

            const rutaArchivo = path.resolve(
                carpetaRuta,
                nombreArchivo
            );

            // Verificar que el archivo esté dentro de la carpeta esperada.
            if (!rutaArchivo.startsWith(carpetaRuta + path.sep)) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "La ruta del archivo no es válida."
                });
            }

            // Comprobar que el archivo exista.
            try {
                await fs.promises.access(rutaArchivo);
            } catch {
                return res.status(404).json({
                    ok: false,
                    mensaje: "La evidencia no existe."
                });
            }

            // Eliminar el archivo físico.
            await fs.promises.unlink(rutaArchivo);

            return res.status(200).json({
                ok: true,
                mensaje: "Evidencia eliminada correctamente."
            });

        } catch (error) {
            console.error("Error al borrar evidencia:", error);

            return res.status(500).json({
                ok: false,
                mensaje: "Error al eliminar la evidencia."
            });
        }
    }


    #error(res, err) {
        console.error('Error en historiaUsuarioControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = historiaUsuarioControlador;