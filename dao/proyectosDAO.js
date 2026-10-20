/**
 * DAO para la gestión de proyectos, asignación de colaboradores y control de invitaciones.
 */
class ProyectosDAO {
    constructor(pool) {
        this.pool = pool; // El pool de conexiones a Postgres
    }

    /**
     * Crea un proyecto y registra al creador y a los colaboradores invitados en una transacción segura.
     * @param {Object} proyectoData - Datos del proyecto y arreglo de colaboradores.
     */
    async crearProyectoConColaboradores(proyectoData) {
        const { nombre, creador, duracion, colaboradores = [] } = proyectoData;
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN'); // Iniciamos transacción

            // 1. Insertar el proyecto principal
            const queryProyecto = `
                INSERT INTO scrumbird.proyecto (nombre, creador, fecha_creacion, duracion)
                VALUES ($1, $2, CURRENT_DATE, $3)
                RETURNING id, nombre, creador, fecha_creacion, duracion;
            `;
            const resProyecto = await client.query(queryProyecto, [nombre, creador, duracion]);
            const nuevoProyecto = resProyecto.rows[0];
            const proyectoId = nuevoProyecto.id;

            // 2. Asegurar que el creador quede registrado en el proyecto (ej. como Product Owner)
            const queryCreadorRelacion = `
                INSERT INTO scrumbird.trabajando_en_proyecto (id_usuario, id_proyecto, rol)
                VALUES ($1, $2, $3)
                ON CONFLICT (id_usuario, id_proyecto) DO NOTHING;
            `;
            await client.query(queryCreadorRelacion, [creador, proyectoId, 'Product Owner']);

            // 3. Registrar a los colaboradores seleccionados inicialmente si es necesario
            for (const colab of colaboradores) {
                if (colab.id_usuario !== creador) {
                    const queryColab = `
                        INSERT INTO scrumbird.trabajando_en_proyecto (id_usuario, id_proyecto, rol)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (id_usuario, id_proyecto) DO NOTHING;
                    `;
                    await client.query(queryColab, [colab.id_usuario, proyectoId, colab.rol || 'Developer']);
                }
            }

            await client.query('COMMIT'); // Confirmamos la transacción
            return nuevoProyecto;
        } catch (err) {
            await client.query('ROLLBACK'); // Revertimos si hay error
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Lista todos los usuarios registrados para el selector de invitados en el frontend.
     */
    async listarUsuariosDisponibles() {
        const query = `
            SELECT id, nombre, correo_electronico, nombre_de_usuario 
            FROM scrumbird.usuario 
            ORDER BY id;
        `;
        const { rows } = await this.pool.query(query);
        return rows;
    }

    /**
     * Inserta al colaborador cuando acepta formalmente la invitación desde el correo.
     */
    async agregarColaboradorAceptado(datos) {
        const { id_usuario, id_proyecto, rol } = datos;
        const query = `
            INSERT INTO scrumbird.trabajando_en_proyecto (id_usuario, id_proyecto, rol)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_usuario, id_proyecto) 
            DO UPDATE SET rol = EXCLUDED.rol;
        `;
        await this.pool.query(query, [id_usuario, id_proyecto, rol]);
    }
}

module.exports = ProyectosDAO;