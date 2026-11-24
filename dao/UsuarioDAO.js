/**
 * @class UsuarioDAO
 * @description Capa de acceso a datos para la tabla scrumbird.usuario en PostgreSQL.
 */
//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class UsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }
    
    async listar() {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, password, correo_electronico, nombre_de_usuario FROM scrumbird.usuario ORDER BY id;'
        );
        return rows;
    }

    // Consulta de prueba sobre todas los campos de usuario menos la contraseña
    async listar2() {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, correo_electronico, nombre_de_usuario FROM scrumbird.usuario ORDER BY id;'
        );
        return rows;
    }

    async obtenerPorId(id) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, password, correo_electronico, nombre_de_usuario FROM scrumbird.usuario WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    }

    // Incluye passwd (hash) porque se usa para verificar el login
    async obtenerPorUsername(nombreDeUsuario) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, password, correo_electronico, nombre_de_usuario FROM scrumbird.usuario WHERE nombre_de_usuario = $1',
            [nombreDeUsuario]
        );
        return rows[0] || null;
    }

    /**
     * Inserta un nuevo usuario en la base de datos.
     * @async
     * @param {Object} datos - Datos del usuario.
     * @param {string} datos.nombre - Nombre completo del usuario.
     * @param {string} datos.password - Contraseña cifrada (hash).
     * @param {string} datos.correoElectronico - Correo electrónico.
     * @param {string} datos.nombreDeUsuario - Nombre de usuario (username).
     * @returns {Promise<Object>} El registro insertado.
     */
    async crear({ nombre, password, correoElectronico, nombreDeUsuario }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.usuario (nombre, password, correo_electronico, nombre_de_usuario) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, password, correo_electronico, nombre_de_usuario`,
            [nombre, password, correoElectronico, nombreDeUsuario]
        );
        return rows[0];
    }

    async actualizar(id, { nombre, correoElectronico, nombreDeUsuario }) {
        const { rows } = await this.pool.query(
            `UPDATE scrumbird.usuario SET nombre = $1, correo_electronico = $2, nombre_de_usuario = $3
            WHERE id = $4
            RETURNING id, nombre, password, correo_electronico, nombre_de_usuario`,
            [nombre, correoElectronico, nombreDeUsuario, id]
        );
        return rows[0] || null;
    }

    async cambiarPasswd(id, passwdHash) {
        const { rowCount } = await this.pool.query(
            'UPDATE scrumbird.usuario SET password = $1 WHERE id = $2',
            [passwdHash, id]
        );
        return rowCount > 0;
    }

    async eliminar(id) {
        const { rowCount } = await this.pool.query(
            'DELETE FROM scrumbird.usuario WHERE id = $1',
            [id]
        );
        return rowCount > 0;
    }
    // Obtener usuario por correo electrónico para login
    async obtenerPorCorreo(correo) {
        const { rows } = await this.pool.query(
            'SELECT id, nombre, password, correo_electronico, nombre_de_usuario FROM scrumbird.usuario WHERE correo_electronico = $1',
            [correo]
        );
        return rows[0] || null;
    }

    async listarUsuariosPorEquipo(id_proyecto) {
        //console.log("idProyecto recibido en DAO:", id_proyecto);
        const { rows } = await this.pool.query(
            'SELECT U.nombre AS U_nombre, U.id, P.nombre, TEP.id_proyecto FROM scrumbird.trabajando_en_proyecto TEP, scrumbird.proyecto P, scrumbird.usuario U WHERE P.id=$1 AND TEP.id_proyecto=P.id AND TEP.id_usuario=U.id',
            [id_proyecto]
        );
        return rows;
    }

   async obtenerProgresoCapacitacion(id_usuario) {
    const { rows } = await this.pool.query(
        `SELECT id_usuario, modulo_actual, seccion_actual, guia_terminada
        FROM scrumbird.progreso_capacitacion
        WHERE id_usuario = $1`,
        [id_usuario]
    );

    return rows[0] || null;
    }
    async actualizarModuloCapacitacion(nuevoModulo, idUsuario) {
      const { rows } = await this.pool.query(
        `UPDATE scrumbird.progreso_capacitacion AS p
        SET modulo_actual = primera.id_modulo,
            seccion_actual = primera.id,
            guia_terminada = false
        FROM (
          SELECT id, id_modulo
          FROM scrumbird.secciones
          WHERE id_modulo = $1
          ORDER BY numero_seccion, id
          LIMIT 1
        ) AS primera
        WHERE p.id_usuario = $2
        RETURNING p.*`,
        [nuevoModulo, idUsuario]
      );

      return rows[0] || null;
    }

  async actualizarSeccionCapacitacion(nuevaSeccion, idUsuario) {
    const { rows } = await this.pool.query(
      `UPDATE scrumbird.progreso_capacitacion AS p
      SET seccion_actual = s.id,
          guia_terminada = false
      FROM scrumbird.secciones AS s
      WHERE p.id_usuario = $2
        AND s.id = $1
        AND s.id_modulo = p.modulo_actual
      RETURNING p.*`,
      [nuevaSeccion, idUsuario]
    );

    return rows[0] || null;
  }
    async terminarSeccionCapacitacion(idUsuario, idSeccion) {
  const cliente = await this.pool.connect();

  try {
    await cliente.query("BEGIN");

    // Bloquear el progreso mientras se actualiza.
    const { rows } = await cliente.query(`
      SELECT
        p.*,
        s.numero_seccion,
        m.numero_modulo
      FROM scrumbird.progreso_capacitacion p
      JOIN scrumbird.secciones s
        ON s.id = p.seccion_actual
       AND s.id_modulo = p.modulo_actual
      JOIN scrumbird.modulos m
        ON m.id = p.modulo_actual
      WHERE p.id_usuario = $1
      FOR UPDATE OF p
    `, [idUsuario]);

    const actual = rows[0];

    if (!actual) {
      throw new Error("El progreso no existe o es inconsistente.");
    }

    if (
      actual.guia_terminada ||
      Number(actual.seccion_actual) !== Number(idSeccion)
    ) {
      throw new Error("Solo puedes terminar la sección actual.");
    }

    // Buscar la siguiente sección del mismo módulo.
    const siguientes = await cliente.query(`
      SELECT id, id_modulo
      FROM scrumbird.secciones
      WHERE id_modulo = $1
        AND numero_seccion > $2
      ORDER BY numero_seccion, id
      LIMIT 1
    `, [actual.modulo_actual, actual.numero_seccion]);

    let siguiente = siguientes.rows[0];
    let guiaTerminada = false;

    if (!siguiente) {
      // Buscar el siguiente módulo según su orden.
      const modulos = await cliente.query(`
        SELECT id
        FROM scrumbird.modulos
        WHERE numero_modulo > $1
        ORDER BY numero_modulo, id
        LIMIT 1
      `, [actual.numero_modulo]);

      const siguienteModulo = modulos.rows[0];

      if (siguienteModulo) {
        const secciones = await cliente.query(`
          SELECT id, id_modulo
          FROM scrumbird.secciones
          WHERE id_modulo = $1
          ORDER BY numero_seccion, id
          LIMIT 1
        `, [siguienteModulo.id]);

        siguiente = secciones.rows[0];

        if (!siguiente) {
          throw new Error(
            "El siguiente módulo todavía no tiene secciones configuradas."
          );
        }
      } else {
        guiaTerminada = true;
      }
    }

    const actualizado = await cliente.query(`
      UPDATE scrumbird.progreso_capacitacion
      SET modulo_actual = $1,
          seccion_actual = $2,
          guia_terminada = $3
      WHERE id_usuario = $4
      RETURNING *
    `, [
      siguiente ? siguiente.id_modulo : actual.modulo_actual,
      siguiente ? siguiente.id : actual.seccion_actual,
      guiaTerminada,
      idUsuario
    ]);

    await cliente.query("COMMIT");

    return actualizado.rows[0];
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
}

module.exports = UsuarioDAO;