// Controlador de Usuarios: valida la entrada, aplica reglas y responde HTTP
//Aquí ya no viene ni una sentencia SQL
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const MAX = { nombre: 20, username: 20, email: 25, passwd: 20 };

class UsuariosControlador {
    constructor(usuarioDAO) {
        this.dao = usuarioDAO;
    }

    // GET /usuarios
    async listar(req, res) {
        try {
        res.json(await this.dao.listar());
        } catch (err) {
        this.#error(res, err);
        }
    }

    // En UsuarioControlador.js
    async listar2(req, res) {
        try {
            const usuarios = await this.dao.listar2();
            res.json({ data: usuarios }); // <--- Aquí se envuelve el array para que `datos.data` funcione
        } catch (err) {
            this.#error(res, err);
        }
    }

    // GET /usuarios/:id
    async obtener(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });
        try {
        const usuario = await this.dao.obtenerPorId(id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
        } catch (err) {
        this.#error(res, err);
        }
    }

    // POST /usuarios   body: { nombre, username, email, passwd }
    /**
     * Procesa la petición POST para registrar un nuevo usuario.
     * Valida los campos, genera el hash de la contraseña y delega la inserción al DAO.
     * @async
     * @param {import('express').Request} req - Objeto de solicitud HTTP de Express.
     * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
     * @returns {Promise<void>}
     */
    async crear(req, res) {
        const { nombre, username, email, passwd } = req.body;
        const problema = this.#validar({ nombre, username, email, passwd }, true);
        if (problema) return res.status(400).json({ error: problema });

        try {
        const passwdHash = await bcrypt.hash(passwd, SALT_ROUNDS);
        const usuario = await this.dao.crear({ nombre, password:passwdHash, correoElectronico: email, nombreDeUsuario: username });
        res.status(201).json(usuario);
        } catch (err) {
        this.#error(res, err);
        }
    }

    // PUT /usuarios/:id   body: { nombre, username, email }
    async actualizar(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });

        const { nombre, username, email } = req.body;
        const problema = this.#validar({ nombre, username, email });
        if (problema) return res.status(400).json({ error: problema });

        try {
        const usuario = await this.dao.actualizar(id, { nombre, email, username });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
        } catch (err) {
        this.#error(res, err);
        }
    }

    // PUT /usuarios/:id/passwd   body: { passwd }
    async cambiarPasswd(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });

        const { passwd } = req.body;
        if (!passwd || passwd.length > MAX.passwd) {
        return res.status(400).json({ error: `passwd es obligatorio (máx. ${MAX.passwd} caracteres)` });
        }

        try {
        const passwdHash = await bcrypt.hash(passwd, SALT_ROUNDS);
        const ok = await this.dao.cambiarPasswd(id, passwdHash);
        if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.status(204).end();
        } catch (err) {
        this.#error(res, err);
        }
    }

    // DELETE /usuarios/:id
    async eliminar(req, res) {
        const id = this.#idValido(req.params.id);
        if (!id) return res.status(400).json({ error: 'id inválido' });
        try {
        const ok = await this.dao.eliminar(id);
        if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.status(204).end();
        } catch (err) {
        this.#error(res, err);
        }
    }

    
    // POST /usuarios/login   body: { identificador, passwd } o { email, passwd }
    async login(req, res) {
        // Acepta 'email', 'correo', o 'username' desde el formulario
        const identificador = req.body.email || req.body.correo || req.body.username;
        const passwd = req.body.passwd || req.body.password;

        if (!identificador || !passwd) {
            return res.status(400).json({ error: 'El correo/usuario y la contraseña son obligatorios' });
        }

        try {
            // 1. Busca por correo; si no lo halla, intenta por username
            let usuario = null;
            if (typeof this.dao.obtenerPorCorreo === 'function') {
                usuario = await this.dao.obtenerPorCorreo(identificador);
            }
            if (!usuario) {
                usuario = await this.dao.obtenerPorUsername(identificador);
            }

            // 2. Compara contra usuario.password (nombre real en PostgreSQL)
            const valido = usuario && (await bcrypt.compare(passwd, usuario.password));
            if (!valido) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }

            // 3. Omite la contraseña en la respuesta
            const { password: _omitido, ...publico } = usuario;
            res.json({ ok: true, data: publico });
        } catch (err) {
            this.#error(res, err);
        }
    }

    // ---- Métodos privados ----

    #idValido(valor) {
        const id = Number(valor);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    // Devuelve un mensaje de error o null si todo está bien
    #validar({ nombre, username, email, passwd }, exigirPasswd = false) {
        if (!nombre || !username) return 'nombre y username son obligatorios';
        if (nombre.length > MAX.nombre) return `nombre: máximo ${MAX.nombre} caracteres`;
        if (username.length > MAX.username) return `username: máximo ${MAX.username} caracteres`;
        if (email) {
        if (email.length > MAX.email) return `email: máximo ${MAX.email} caracteres`;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'email con formato inválido';
        }
        if (exigirPasswd) {
        if (!passwd) return 'passwd es obligatorio';
        if (passwd.length > MAX.passwd) return `passwd: máximo ${MAX.passwd} caracteres`;
        }
        return null;
    }

    #error(res, err) {
        if (err.code === '23505') { // violación de unicidad en PostgreSQL
        return res.status(409).json({ error: 'El username ya existe' });
        }
        console.error('Error en UsuariosControlador:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = UsuariosControlador;