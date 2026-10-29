//El DAO es el único lugar donde se escribe SQL de la tabla que accedemos
class historiaUsuarioDAO {
    constructor(pool) {
        this.pool = pool; //Este pool es el verdadero conector con Postgres, es una clase JavaScript dentro del proyecto
    }


    let patronNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\x20]+$/; // Patron que permite todo el abcdario, la ñ, espacios y numeros del 0 al 9.
    let patronRangoValor = /^(?:[0-9]{1,3}|[1-3][0-9]{3}|4000)$/; // Patron que permite valores entre 0 y 4000
    
    //Funcion que obtiene las historias de usuario existentes en el servidor en forma de objetos javascript
    async obtenerHistorias() {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.historia_de_usuario ORDER BY id;'
        );
        return rows;
    }

    //Funcion que obtiene una historia de usuario utilizando su id en el servidor en forma de objeto javascript
    async obtenerHistoriaPorId(id) {
        const { rows } = await this.pool.query(
            'SELECT * FROM scrumbird.historia_de_usuario WHERE id = $1;',
            [id]
        );
        return rows [0] || null;
    }

    //Funcion que obtiene una historia de usuario utilizando su id en el servidor en forma de objeto javascript
    async agregarHistoria({nombre, descripcion, criterios, valor, sprint}) {
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.historia_de_usuario (nombre, descripcion, criterios_de_aceptacion, valor, asignado_al_sprint) 
             VALUES ($1, $2, $3, $4, $5) 
             `,
            [nombre, descripcion, criterios, valor, sprint]
        );
        return rows;
    }

    //Funcion que elimina una historia de usuario en el servidor utilizando su id
    async eliminarHistoriaDao({idHistoria}) {
        try{
            const { rows } = await this.pool.query(
                `DELETE FROM scrumbird.historia_de_usuario WHERE id = $1;
                `,
                [idHistoria]
            );
            return {
                ok:true,
                eliminado:true
            };
        }catch(error){
            console.error("Error al borrar la historia de usuario en BD", error);
            throw error;
        }
    }

    //Funcion que modifica una historia de usuario en el servidor, utilizando todos sus campos en el Product Backlog
    async modificarHistoriaDao({id, nombre, descripcion, criterios, valor, sprint}) {
        const { rows } = await this.pool.query(
            `UPDATE scrumbird.historia_de_usuario SET nombre = $2, descripcion = $3, criterios_de_aceptacion = $4, valor = $5, asignado_al_sprint = $6
            WHERE id = $1`,
            [id, nombre, descripcion, criterios, valor, sprint]
        );
        return rows ;
    }

    //Funcion que modifica una historia de usuario en el servidor, utilizando todos sus campos
    async modificarHistoriaDao({id, nombre, descripcion, criterios, valor, prioridad, puntosHistoria, factorComplejidad,  costeEstimado, sprint}) {
        const { rows } = await this.pool.query(
            `UPDATE scrumbird.historia_de_usuario SET nombre = $2, descripcion = $3, criterios_de_aceptacion = $4, valor = $5, prioridad = $6, puntos_de_historia = $7, factor_de_complejidad = $8, coste_estimado = $9, asignado_al_sprint = $10
            WHERE id = $1
            RETURNING id, nombre, descripcion, criterios_de_aceptacion, valor, prioridad, puntos_de_historia, factor_de_complejidad, coste_estimado, asignado_al_sprint;`,
            [id, nombre, descripcion, criterios, valor, prioridad, puntosHistoria, factorComplejidad,  costeEstimado, sprint]
        );
        return rows ;
    }
}

module.exports = historiaUsuarioDAO;