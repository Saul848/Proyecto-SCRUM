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

    #error(res, err) {
        console.error('Error en historiaUsuarioControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }

    // DELETE /historias  body: { titulo, descripcion, criterios, valor, sprintAsig }
    async eliminarHistoriaC(req, res) {
        try {
            const { id } = req.body;
            //Si mi id no tiene valor o si no es un entero regreso la respuesta correspondiente
            if(!id || !Number.isInteger(id)){
                return res.status(404).json({
                    ok: false,
                    mensaje: "Error el id de la historia no es valido"
                })
            }
            //Verificamos si la historia existe en la base de datos
            const historiaExistente = await this.dao.obtenerHistoriaPorId(id);
            if(historiaExistente && historiaExistente.id === id){
                //Eliminamos al empleado de la base de datos y verificamos su respuesta
                const historiaEliminada = await this.dao.eliminarHistoriaDao(id);
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
}

module.exports = historiaUsuarioControlador;