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
        console.log(rows);
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
}

module.exports = UsuarioDAO;