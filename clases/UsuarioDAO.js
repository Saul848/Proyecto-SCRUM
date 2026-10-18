//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class UsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }

    // No devuelvo la contraseña, porque no quiero que la vean. Solo se usa en el login en este caso
    async listar() {
        const { rows } = await this.pool.query(
        'SELECT id, nombre, email, username FROM usuario ORDER BY id'
        );
        return rows;
    }

    async obtenerPorId(id) {
        const { rows } = await this.pool.query(
        'SELECT id, nombre, email, username FROM usuario WHERE id = $1',
        [id]
        );
        return rows[0] || null;
    }

    // Incluye passwd (hash) porque se usa para verificar el login
    async obtenerPorUsername(username) {
        const { rows } = await this.pool.query(
        'SELECT id, nombre, email, username, passwd FROM usuario WHERE username = $1',
        [username]
        );
        return rows[0] || null;
    }

    async crear({ nombre, passwdHash, email, username }) {
        const { rows } = await this.pool.query(
        `INSERT INTO usuario (nombre, passwd, email, username)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nombre, email, username`,
        [nombre, passwdHash, email, username]
        );
        return rows[0];
    }

    async actualizar(id, { nombre, email, username }) {
        const { rows } = await this.pool.query(
        `UPDATE usuario SET nombre = $1, email = $2, username = $3
        WHERE id = $4
        RETURNING id, nombre, email, username`,
        [nombre, email, username, id]
        );
        return rows[0] || null;
    }

    async cambiarPasswd(id, passwdHash) {
        const { rowCount } = await this.pool.query(
        'UPDATE usuario SET passwd = $1 WHERE id = $2',
        [passwdHash, id]
        );
        return rowCount > 0;
    }

    async eliminar(id) {
        const { rowCount } = await this.pool.query(
        'DELETE FROM usuario WHERE id = $1',
        [id]
        );
        return rowCount > 0;
    }
}

module.exports = UsuarioDAO;