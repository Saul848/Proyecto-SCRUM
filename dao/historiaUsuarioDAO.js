//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class historiaUsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }

    async obtenerHistorias() {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.historia_de_usuario ORDER BY id;'
        );
        return rows;
    }

    async agregarHistoria({nombre, descripcion, criterios, valor, sprint}) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, criterios_de_aceptacion, valor, asignado_al_sprint) 
             VALUES ($1, $2, $3, $4, $5) 
             `,
            [nombre, descripcion, criterios, valor, sprint]
        );
        return rows;
    }

    async eliminarHistoriaDao({idHistoria}) {
        const { rows } = await this.pool.query(
            `DELETE FROM scrumbird.historia_de_usuario WHERE id = $1 RETURNING *
             `,
            [idHistoria]
        );
        return rows ;
    }

    async modificarHistoriaDao({id, nombre, descripcion, criterios, valor, prioridad, puntosHistoria, factorComplejidad,  costeEstimado, sprint}) {
        const { rows } = await this.pool.query(
            `UPDATE scrumbird.historia_de_usuario SET nombre = $2, descripcion = $3, criterios_de_aceptacion = $4, valor = $5, prioridad = $6, puntos_de_historia = $7, factor_de_complejidad = $8, coste_estimado = $9, asignado_al_sprint = $10
            WHERE id = $1
            RETURNING id, nombre, descripcion, criterios_de_aceptacion, valor, prioridad, puntos_de_historia, factor_de_complejidad, coste_estimado, asignado_al_sprint`,
            [id, nombre, descripcion, criterios, valor, prioridad, puntosHistoria, factorComplejidad,  costeEstimado, sprint]
        );
        return rows ;
    }
}

module.exports = historiaUsuarioDAO;