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
        const { nombre, descripcion, criterios, valor, sprint } = req.body;
        try {
            const historiaCreada = await this.dao.agregarHistoria(req.body);

            // Creacion de carpeta de evidencias
            const idHistoria = historiaCreada.id;
            const proyectoId = historiaCreada.id_proyecto

            // 2. Crear físicamente la carpeta de evidencias para esta historia: evidencias/idProyecto/idHistoria
            if (proyectoId && idHistoria) {
                crearCarpetaHistoria(proyectoId, idHistoria);
            }


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

            if (
                !nombreArchivo ||
                nombreArchivo !== path.basename(nombreArchivo) ||
                !/\.(png|jpe?g)$/i.test(nombreArchivo)
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Nombre de archivo no válido."
                });
            }


            // Evitar nombres de archivo inválidos o rutas manipuladas.
            if (
                !nombreArchivo ||
                nombreArchivo !== path.basename(nombreArchivo) ||
                !/\.(png|jpe?g)$/i.test(nombreArchivo)
            ) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Nombre de archivo no válido."
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