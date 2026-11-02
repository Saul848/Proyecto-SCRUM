const MensajeClienteDAO = require('../dao/MensajesClienteDAO');
// Si se va a enviar correo al facilitador con nodemailer, se importa el servicio:  const emailService = require('../utils/emailService');

class MensajeClienteControlador {
  /**
   * Obtiene la conversación completa de un canal
   */
  static async obtenerMensajes(req, res) {
    const { idCanal } = req.params;

    if (!idCanal) {
      return res.status(400).json({ ok: false, error: 'El ID del canal es requerido' });
    }

    try {
      const mensajes = await MensajeClienteDAO.obtenerPorCanal(idCanal);
      return res.json({ ok: true, data: mensajes });
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      return res.status(500).json({ ok: false, error: 'Error interno al consultar mensajes' });
    }
  }

  /**
   * Guarda un nuevo mensaje enviado por el cliente o equipo
   */
  static async enviarMensaje(req, res) {
    const { idCanal, idUsuario, contenido } = req.body;

    if (!idCanal || !idUsuario || !contenido || !contenido.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: 'idCanal, idUsuario y el contenido del mensaje son obligatorios' 
      });
    }

    try {
      const nuevoMensaje = await MensajeClienteDAO.guardar(idCanal, idUsuario, contenido.trim());

      // Notificación por correo al equipo sobre nuevo requisito 
      /*
      try {
        await emailService.enviarNotificacion({
          asunto: 'Nuevo requisito notificado por el Cliente',
          mensaje: contenido.trim()
        });
      } catch (errCorreo) {
        console.warn('No se pudo enviar el correo de notificación:', errCorreo.message);
      }
      */

      return res.status(201).json({ ok: true, data: nuevoMensaje });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return res.status(500).json({ ok: false, error: 'Error interno al guardar mensaje' });
    }
  }

  /**
   * Obtiene los canales disponibles para el proyecto activo
   */
  static async obtenerCanales(req, res) {
    const { idProyecto } = req.params;

    if (!idProyecto) {
      return res.status(400).json({ ok: false, error: 'El ID del proyecto es requerido' });
    }

    try {
      const canales = await MensajeClienteDAO.obtenerCanalesPorProyecto(idProyecto);
      return res.json({ ok: true, data: canales });
    } catch (error) {
      console.error('Error al obtener canales:', error);
      return res.status(500).json({ ok: false, error: 'Error interno al consultar canales' });
    }
  }

  // Obtener mensajes directos entre el cliente y el Scrum Master
  
    static async obtenerMensajesDirectos(req, res) {
        try {
            const { idUsuario, idDestino } = req.params;
            
            const mensajes = await MensajeClienteDAO.obtenerMensajesDirectos(idUsuario, idDestino);
            res.json({ ok: true, data: mensajes });
        } catch (error) {
            console.error('Error al obtener mensajes directos en controlador:', error);
            res.status(500).json({ ok: false, mensaje: 'Error al obtener mensajes directos' });
        }
    }

    // Guardar un mensaje directo 
    static async guardarMensajeDirecto(req, res) {
        try {
            const { idAutor, idUsuarioDestino, contenido } = req.body;
            
            if (!contenido || !idUsuarioDestino) {
                return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios' });
            }

            const mensajeGuardado = await MensajeClienteDAO.guardarMensajeDirecto(idAutor, idUsuarioDestino, contenido);
            res.json({ ok: true, data: mensajeGuardado });
        } catch (error) {
            console.error('Error al guardar mensaje directo en controlador:', error);
            res.status(500).json({ ok: false, mensaje: 'Error al enviar mensaje directo' });
        }
    }
}

module.exports = MensajeClienteControlador;