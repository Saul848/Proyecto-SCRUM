const GrupoDAO = require('../dao/grupoDAO');

/**
 * Controlador para gestionar los grupos de conversación.
 * @class GrupoControlador
 */
class GrupoControlador {

    /**
     * Crea un grupo dentro de un proyecto y registra sus participantes.
     */
    static async crearGrupo(req, res) {
        try {
            const {
                idProyecto,
                idCreador,
                nombre,
                descripcion,
                participantes
            } = req.body;

            // Validar los datos recibidos.
            const proyecto = Number(idProyecto);
            const creador = Number(idCreador);

            if (
                !Number.isInteger(proyecto) || proyecto <= 0 ||
                !Number.isInteger(creador) || creador <= 0 ||
                typeof nombre !== 'string' ||
                !nombre.trim() ||
                nombre.trim().length > 100 ||
                typeof descripcion !== 'string' ||
                !Array.isArray(participantes) ||
                participantes.length === 0 ||
                !participantes.every(id =>
                    Number.isInteger(id) && id > 0
                )
            ) {
                return res.status(400).json({
                    ok: false,
                    error: 'Los datos del grupo son inválidos o están incompletos'
                });
            }

            // Crear el grupo utilizando el DAO.
            const grupo = await GrupoDAO.crearGrupo(
                proyecto,
                creador,
                nombre.trim(),
                descripcion.trim(),
                participantes
            );

            return res.status(201).json({
                ok: true,
                mensaje: 'Grupo creado correctamente',
                data: grupo
            });

        } catch (error) {
            console.error('Error al crear grupo:', error);

            if (
                error.message === 'El creador no pertenece al proyecto' ||
                error.message === 'Uno o más participantes no pertenecen al proyecto'
            ) {
                return res.status(403).json({
                    ok: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                ok: false,
                error: 'No se pudo crear el grupo'
            });
        }
    }
    
/**
 * Obtiene los grupos de un usuario dentro de un proyecto.
 */
static async obtenerGruposUsuario(req, res) {
    try {
        const idUsuario = Number(req.params.idUsuario);
        const idProyecto = Number(req.params.idProyecto);

        if (
            !Number.isInteger(idUsuario) || idUsuario <= 0 ||
            !Number.isInteger(idProyecto) || idProyecto <= 0
        ) {
            return res.status(400).json({
                ok: false,
                error: 'El usuario o proyecto no es válido'
            });
        }

        const grupos = await GrupoDAO.obtenerGruposUsuario(
            idUsuario,
            idProyecto
        );

        return res.json({
            ok: true,
            data: grupos
        });

    } catch (error) {
        console.error('Error al obtener grupos:', error);

        return res.status(500).json({
            ok: false,
            error: 'No se pudieron obtener los grupos'
        });
    }
}

/**
 * Elimina a un participante de un grupo.
 * Solo los administradores pueden realizar esta acción.
 */
static async eliminarParticipante(req, res) {
    try {
        const idGrupo = Number(req.params.idGrupo);
        const idParticipante = Number(req.params.idParticipante);
        const idAdministrador = Number(req.body.idAdministrador);

        // Validar los identificadores recibidos.
        if (
            !Number.isInteger(idGrupo) || idGrupo <= 0 ||
            !Number.isInteger(idParticipante) || idParticipante <= 0 ||
            !Number.isInteger(idAdministrador) || idAdministrador <= 0
        ) {
            return res.status(400).json({
                ok: false,
                error: 'Los identificadores proporcionados no son válidos'
            });
        }

        // Solicitar al DAO que elimine al participante.
        const resultado = await GrupoDAO.eliminarParticipante(
            idGrupo,
            idAdministrador,
            idParticipante
        );

        return res.json({
            ok: true,
            mensaje: 'Participante eliminado correctamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error al eliminar participante:', error);

        const erroresConocidos = [
            'No tienes permisos para eliminar participantes',
            'El administrador no puede eliminarse a sí mismo',
            'El participante no pertenece al grupo'
        ];

        if (erroresConocidos.includes(error.message)) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }

        return res.status(500).json({
            ok: false,
            error: 'No se pudo eliminar al participante'
        });
    }
}

static async obtenerParticipantes(req, res) {
    try {
        const idGrupo = Number(req.params.idGrupo);
        const idUsuario = Number(req.params.idUsuario);

        // Validar los identificadores recibidos
        if (
            !Number.isInteger(idGrupo) || idGrupo <= 0 ||
            !Number.isInteger(idUsuario) || idUsuario <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los identificadores del grupo y usuario no son válidos'
            });
        }

        // Consultar los participantes desde el DAO
        const participantes = await GrupoDAO.obtenerParticipantes(
            idGrupo,
            idUsuario
        );

        return res.status(200).json({
            ok: true,
            data: participantes
        });

    } catch (error) {
        console.error('Error al obtener participantes:', error);

        if (error.message === 'No perteneces a este grupo') {
            return res.status(403).json({
                ok: false,
                mensaje: error.message
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar los participantes del grupo'
        });
    }
}

static async agregarParticipantes(req, res) {
    try {
        const idGrupo = Number(req.params.idGrupo);

        const {
            idAdministrador,
            participantes
        } = req.body;

        const idAdmin = Number(idAdministrador);

        // Validar los identificadores
        if (
            !Number.isInteger(idGrupo) || idGrupo <= 0 ||
            !Number.isInteger(idAdmin) || idAdmin <= 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los identificadores no son válidos'
            });
        }

        // Validar la lista de participantes
        if (
            !Array.isArray(participantes) ||
            participantes.length === 0 ||
            !participantes.every(
                id => Number.isInteger(id) && id > 0
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Debes seleccionar al menos un participante válido'
            });
        }

        // Agregar los participantes mediante el DAO
        const resultado = await GrupoDAO.agregarParticipantes(
            idGrupo,
            idAdmin,
            participantes
        );

        return res.status(200).json({
            ok: true,
            mensaje: 'Participantes agregados correctamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error al agregar participantes:', error);

        const erroresConocidos = [
            'No tienes permisos para agregar participantes',
            'Uno o más participantes no pertenecen al proyecto',
            'Uno o más participantes ya pertenecen al grupo'
        ];

        if (erroresConocidos.includes(error.message)) {
            return res.status(400).json({
                ok: false,
                mensaje: error.message
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: 'Error al agregar participantes al grupo'
        });
    }
}

}

module.exports = GrupoControlador;
