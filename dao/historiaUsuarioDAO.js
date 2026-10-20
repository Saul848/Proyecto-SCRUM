//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class historiaUsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }

    // No devuelvo la contraseña, porque no quiero que la vean. Solo se usa en el login en este caso
    async obtenerHistorias() {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.historia_de_usuario ORDER BY id;'
        );
        return rows;
    }

    async agregarHistoria({ id, nombre, descripccion, criterios, valor, sprint }) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.historia_de_usuario ( id, nombre, descripccion, criterios, valor, sprint) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             `,
        );
        return;
    }
}

module.exports = historiaUsuarioDAO;