const historiaUsuarioDAO = require("../dao/historiaUsuarioDAO");

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

/**
 * Funcion que responde ante una solicitud de modificacion
 * Verifica la informacion enviada por el cliente
 * Regresa una respuesta al cliente de exito o error
 * @param {Object} req - Objeto de petición HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {res} Respuesta con un mensaje de confirmacion
 * @returns {error} Si no pudo modificar a un empleado a un empleado
 */
async modificarHistoria = async (req, res) => {
    try {
        // Se obtienen los datos de la solicitud
        const { id, nombre, descripcion, criterios, valor, sprint } = req.body;
        //Se verifica que el cliente haya enviado un id
        if (id === "") {
            return res.status(404).json({
                ok: false,
                mensaje: "El id enviado esta vacio o es indefindo"
            })
        }
        // Se verifica que el id sea un numero y que este no sea menor o igual a 0
        if (isNaN(Number(id)) || parseInt(id) <= 0) {
            return res.status(404).json({
                ok: false,
                mensaje: "El id enviado esta vacio o es indefindo"
            })
        }
        //Se verifica que la historia exista en la bd
        const historiaExistente = await this.dao.obtenerHistoriaPorId(id);
        //Si no existe se envia un mensaje de error
        if (!historiaExistente) {
            return res.status(404).json({
                ok: false,
                mensaje: "La historia no existe en la bd"
            })
        }
        //Si existe mi empleado entonces se crea un arreglo para guardar los datos recuperados con contenido
        let datosNuevos = [];
        //Verificamos que los datos recuperados tengan un valor y lo agregamos a un arreglo "Datos nuevos" si es el caso

        if (nombre !== "") datosNuevos.push({ campo: 'nombre', valor: nombre });
        if (descripcion !== "") datosNuevos.push({ campo: 'descripcion', valor: descripcion });
        if (criterios !== "") datosNuevos.push({ campo: 'criterios', valor: criterios });
        if (valor !== "") datosNuevos.push({ campo: 'valor', valor: valor });
        if (sprint !== "") datosNuevos.push({ campo: 'sprint', valor: sprint });

        //Se verifica la informacion de la historia, esto recorriendo el arreglo datosNuevos e identificando los valores, 
        for (let m = 0; m < datosNuevos.length; m++) {
            //Identificamos los campos de los objetos js y verificamos su valor
            if (datosNuevos[m].campo === 'nombre') {
                //Si el nuevo nombre no es valido entonces se envia un mensaje de error
                if (!patronNombre.test(datosNuevos[m].valor)) {
                    return res.status(404).json({
                        ok: false,
                        mensaje: "El nuevo nombre no es valido"
                    })
                }
            }
            if (datosNuevos[m].campo === 'descripcion') {
                //Si el nuevo puesto no es alguno de los existentes entonces se envia un mensaje de error
                if (!roles.includes(datosNuevos[m].valor)) {
                    return res.status(404).json({
                        ok: false,
                        mensaje: "El nuevo puesto no es valido"
                    })
                }
            }
            if (datosNuevos[m].campo === 'criterios') {
                //Si el nuevo telefono no es valido entonces se envia un mensaje de error 
                if (!patronTel.test(datosNuevos[m].valor)) {
                    return res.status(404).json({
                        ok: false,
                        mensaje: "El nuevo telefono no es valido"
                    })
                }
            }
            if (datosNuevos[m].campo === 'valor') {
                //Si la nueva contraseña no es valida entonces se envia un mensaje de error 
                if (!patronPassword.test(datosNuevos[m].valor)) {
                    return res.status(404).json({
                        ok: false,
                        mensaje: "El nuevo usuario no es valido"
                    })
                }
            }
            if (datosNuevos[m].campo === 'sprint') {
                //Si la nueva no es valido entonces se envia un mensaje de error 
                if (!patronPassword.test(datosNuevos[m].valor)) {
                    return res.status(404).json({
                        ok: false,
                        mensaje: "La nueva contraseña no es valida"
                    })
                }
            }
        }



        //Se actualiza al empleado, utilizando el arreglo de datosNuevos que tiene toda la informacion necesaria para actualizar al empleado
        const empleadoActualizado= await empleadoDao.actualizarEmpleado(id, datosNuevos, responsableAccion);
        const registroCreado= await empleadoDao.registrarAccion("Cambio", await empleadoDao.obtenerEmpleado(id), responsableAccion);
            // Validamos que se hayan modificado los datos del empleado
            if (empleadoActualizado.ok) {
                //Si la accion pudo ser registrada entonces se envia el mensaje correspondiente
                if(registroCreado.ok){
                    return res.status(201).json({
                        ok: true,
                        mensaje: "Empleado modificado correctamente y accion registrada"
                    });
                //Si la accion no pudo ser registrada entonces se envia el mensaje correspondiente
                }else{
                    return res.status(201).json({
                        ok: true,
                        mensaje: "Empleado modificado correctamente, la accion no pudo ser registrada"
                    });                  
                }
            } else {
                return res.status(500).json({
                    ok: false,
                    mensaje: "No se pudo actualizar al empleado, esta accion no sera registrada"
                });
            }
    } catch (error) {
        // Resolucion en caso de error
        return res.status(500).json({
            ok: false,
            mensaje: "Error en el servidor al modificar los datos del empleado"
        });
    }
};

exports.enviarHistorial = async (req, res) =>{
    try {
        // Se recuperan los registros de los empleados
        const historial = await empleadoDao.obtenerHistorial();
        // Si el resultado fue un arreglo vacio entonces se envia la respuesta correspondiente
        if(historial.length===0){
            return res.status(500).json({
                ok:false,
                mensaje:"No se encontraron registros en el sistema"
            });
        // Si el resultado fue un arreglo con los objetos entonces se envia la respuesta correspondiente
        }else{
            return res.status(201).json({
                ok:true,
                mensaje:"Registros recuperados",
                datos: historial
            });
        }
    } catch (error) {
        // Resolucion en caso de error
        return res.status(500).json({
            ok: false,
            mensaje: "Error en el servidor obtener los registros de empleados"
        });      
    }
}

}


module.exports = historiaUsuarioControlador;