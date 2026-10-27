const pool = require('../poolDb'); //ruta Pool de PostgreSQL

class MensajeClienteDAO {
  /**
   * Obtiene todos los mensajes de un canal ordenados cronológicamente, incluyendo el nombre y username del usuario que envió cada mensaje.
   */
  static async obtenerPorCanal(idCanal) {
    const consulta = `
      SELECT 
        m.id,
        m.id_autor AS id_usuario,
        m.mensaje AS contenido,
        m.fecha AS fecha_envio,
        u.nombre AS nombre_usuario,
        u.nombre_de_usuario AS username
      FROM scrumbird.mensaje m
      JOIN scrumbird.usuario u ON m.id_autor = u.id
      WHERE m.id_canal = $1  -- <-- AQUÍ FILTRAMOS POR EL CANAL
      ORDER BY m.fecha ASC;
    `;

    try {
      // Pasamos idCanal como parámetro para evitar inyección SQL
      const { rows } = await pool.query(consulta, [idCanal]);
      return rows;
    } catch (error) {
      console.error('Error para obtener mensajes del canal:', error);
      throw error;
    }
  }
  /**
   * Inserta un nuevo mensaje enviado por un usuario en un canal.
   */
  static async guardar(idCanal, idUsuario, contenido) {
    const consulta = `
      INSERT INTO scrumbird.mensaje (id_canal, id_autor, mensaje, fecha)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, id_canal, id_autor AS id_usuario, mensaje AS contenido, fecha AS fecha_envio;
    `;

    try {
    
      const { rows } = await pool.query(consulta, [idCanal, idUsuario, contenido]);
      
      const usuarioRes = await pool.query(
        'SELECT nombre, nombre_de_usuario FROM scrumbird.usuario WHERE id = $1;',
        [idUsuario]
      );

      const mensajeGuardado = {
        ...rows[0],
        nombre_usuario: usuarioRes.rows[0]?.nombre || 'Usuario',
        username: usuarioRes.rows[0]?.nombre_de_usuario || ''
      };

      return mensajeGuardado;
    } catch (error) {
      console.error('Error para guardar el mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene los canales de comunicación asociados a un proyecto.
   */
  static async obtenerCanalesPorProyecto(idProyecto) {
    const consulta = `
      SELECT id, id_proyecto, nombre, descripcion
      FROM scrumbird.canal
      WHERE id_proyecto = $1
      ORDER BY id ASC;
    `;

    try {
      const { rows } = await pool.query(consulta, [idProyecto]);
      return rows;
    } catch (error) {
      console.error('Error para obtener canales por proyecto:', error);
      throw error;
    }
  }

  /**
   * Obtiene los correos del Scrum Master / Facilitador del proyecto para disparar la notificación por email cuando el cliente envía un requerimiento.
   */
  static async obtenerCorreosEquipo(idProyecto) {
    const consulta = `
      SELECT correo_electronico, nombre 
      FROM scrumbird.usuario 
      WHERE correo_electronico IS NOT NULL;
    `;

    try {
      const { rows } = await pool.query(consulta);
      return rows;
    } catch (error) {
      console.error('Error para obtener correos del equipo:', error);
      return [];
    }
  }
  
  static async contarParticipantes(idCanal) {
  const consulta = `
    SELECT COUNT(DISTINCT id_autor) AS total 
    FROM scrumbird.mensaje 
    WHERE id_canal = $1;
  `;
  const { rows } = await pool.query(consulta, [idCanal]);
  return rows[0].total;
}

/**
   * Obtiene los mensajes privados en un canal directo entre un cliente y un colaborador.
   */
  static async obtenerMensajesDirectos(idUsuarioActual, idScrumMaster) {
    const consulta = `
      SELECT 
        m.id,
        m.id_autor,
        m.id_usuario_destino,
        m.mensaje AS contenido,
        m.fecha AS fecha_envio,
        u.nombre AS nombre_usuario,
        u.nombre_de_usuario AS username
      FROM scrumbird.mensaje m
      JOIN scrumbird.usuario u ON m.id_autor = u.id
      WHERE (m.id_autor = $1 AND m.id_usuario_destino = $2)
         OR (m.id_autor = $2 AND m.id_usuario_destino = $1)
      ORDER BY m.fecha ASC;
    `;

    try {
      const { rows } = await pool.query(consulta, [idUsuarioActual, idScrumMaster]);
      return rows;
    } catch (error) {
      console.error('Error al obtener mensajes directos:', error);
      throw error;
    }
  }

  /**
   * Guarda un mensaje privado 
   */
  static async guardarMensajeDirecto(idAutor, idUsuarioDestino, contenido) {
    const consulta = `
      INSERT INTO scrumbird.mensaje (id_autor, id_usuario_destino, mensaje, fecha, id_canal)
      VALUES ($1, $2, $3, NOW(), NULL)
      RETURNING id, id_autor, id_usuario_destino, mensaje AS contenido, fecha AS fecha_envio;
    `;

    try {
      const { rows } = await pool.query(consulta, [idAutor, idUsuarioDestino, contenido]);
      
      // Obtener datos del autor para la respuesta visual
      const usuarioRes = await pool.query(
        'SELECT nombre, nombre_de_usuario FROM scrumbird.usuario WHERE id = $1;',
        [idAutor]
      );

      return {
        ...rows[0],
        nombre_usuario: usuarioRes.rows[0]?.nombre || 'Usuario',
        username: usuarioRes.rows[0]?.nombre_de_usuario || ''
      };
    } catch (error) {
      console.error('Error al guardar mensaje directo:', error);
      throw error;
    }
  }
  
}

module.exports = MensajeClienteDAO;