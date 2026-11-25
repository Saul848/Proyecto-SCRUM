// valor que se guarda en trabajando_en_historia.estado cuando la historia está terminada
const ESTADOS_TERMINADA = ['terminado'];

class reunionDAO{
    constructor(pool) {
        this.pool = pool; // Conector con Postgres
    }

    //cambia estado a 'En curso'
    async iniciarReunion(idReunion) {
        const { rowCount } = await this.pool.query(
            `UPDATE scrumbird.reunion 
             SET estado = 'En curso' 
             WHERE id = $1;`,
            [idReunion]
        );
        return rowCount;
    }

    //listar reuniones por proyecto
    async obtenerReunionesPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT id, id_proyecto, 
            id_sprint, id_tipo_reunion, 
            nombre, fecha_inicio, fecha_fin, estado 
             FROM scrumbird.reunion 
             WHERE id_proyecto = $1 
             ORDER BY fecha_inicio DESC;`,
            [idProyecto]
        );
        return rows;
    }

    //obtener los sprints de un proyecto
    async obtenerSprintsPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT DISTINCT asignado_al_sprint AS id, 
                    asignado_al_sprint AS no_iteracion, 
                    CONCAT('Sprint ', asignado_al_sprint) AS objetivo
            FROM scrumbird.historia_de_usuario
            WHERE id_proyecto = $1 AND asignado_al_sprint IS NOT NULL
            ORDER BY asignado_al_sprint ASC;`,
            [idProyecto]
        );
        return rows;
    }

    //participantes vinculados al proyecto 
    async obtenerParticipantesPorProyecto(idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT u.id, u.nombre, u.correo_electronico, tp.rol 
             FROM scrumbird.trabajando_en_proyecto tp
             JOIN scrumbird.usuario u ON tp.id_usuario = u.id
             WHERE tp.id_proyecto = $1;`,
            [idProyecto]
        );
        return rows;
    }

    async obtenerTiposReunion() {
        const { rows } = await this.pool.query(
            `SELECT id, nombre 
            FROM scrumbird.tipo_reunion 
            ORDER BY id ASC;`
        );
        return rows;
    }

    //registrar nueva reunion
    async crearReunion(idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin) {
        const estadoInicial = 'Programada';
        const { rows } = await this.pool.query(
            `INSERT INTO scrumbird.reunion (id_proyecto, 
            id_sprint, id_tipo_reunion, nombre, fecha_inicio, 
            fecha_fin, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id;`,
            [idProyecto, idSprint, idTipoReunion, nombre, fechaInicio, fechaFin, estadoInicial]
        );
        return rows[0].id;
    }

    // En reunionDAO.js
    async eliminarReunion(idReunion) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `DELETE FROM scrumbird.reunion_participante
                WHERE id_reunion = $1::integer;`,
                [idReunion]
            );
            const { rowCount } = await client.query(
                `DELETE FROM scrumbird.reunion
                WHERE id = $1::integer;`,
                [idReunion]
            );
            await client.query('COMMIT');
            return rowCount;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async guardarAsignacionesSprint({ idSprint, idProyecto, fechaInicio, fechaFin, asignaciones = [] }) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            if (fechaInicio && fechaFin) {
                await client.query(
                    `UPDATE scrumbird.sprint
                    SET fecha_inicio = $1,
                        fecha_fin = $2
                    WHERE id = $3::integer AND id_proyecto = $4::integer;`,
                    [fechaInicio, fechaFin, idSprint, idProyecto]
                );
            }

            for (const item of asignaciones) {
                const idHistoria = Number(item.idHistoria);
                const idDesarrollador = item.idDesarrollador ? Number(item.idDesarrollador) : null;
                const horasEstimadas = Number(item.horasEstimadas ?? 0);
                const factorComplejidad = Number(item.factorComplejidad ?? 0);
                const horasCalculadas = Number(
                    item.esfuerzoEstimado ?? Math.round(horasEstimadas * (1 + factorComplejidad))
                );
                const estadoInicial = item.estado || "por-empezar";

                await client.query(
                    `UPDATE scrumbird.historia_de_usuario
                    SET horas_estimadas = $1,
                        factor_de_complejidad = $2,
                        asignado_al_sprint = $3::integer,
                        pendiente = false
                    WHERE id = $4::integer AND id_proyecto = $5::integer;`,
                    [horasEstimadas, factorComplejidad, idSprint, idHistoria, idProyecto]
                );

                if (idDesarrollador) {
                    const { rowCount } = await client.query(
                        `UPDATE scrumbird.trabajando_en_historia
                        SET responsable = $1::integer,
                            estado = $2
                        WHERE historia_asignada = $3::integer AND id_proyecto = $4::integer;`,
                        [idDesarrollador, estadoInicial, idHistoria, idProyecto]
                    );

                    if (rowCount === 0) {
                        await client.query(
                            `INSERT INTO scrumbird.trabajando_en_historia
                                (id_proyecto, historia_asignada, responsable, estado)
                            VALUES ($1::integer, $2::integer, $3::integer, $4);`,
                            [idProyecto, idHistoria, idDesarrollador, estadoInicial]
                        );
                    }
                }
            }

            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    async obtenerHistoriasPorSprint(idSprint, idDesarrollador = null) {
        const params = [idSprint];
        let joinDev = "";
        let filtroDev = "";
        let colEstado = `'por-empezar' AS estado_actual`;

        if (idDesarrollador) {
            params.push(idDesarrollador);
            joinDev = `
                INNER JOIN scrumbird.trabajando_en_historia teh
                    ON teh.historia_asignada = h.id
                AND teh.id_proyecto = h.id_proyecto
            `;
            filtroDev = ` AND teh.responsable = $2::integer`;
            colEstado = `COALESCE(teh.estado, 'por-empezar') AS estado_actual`;
        }

        const { rows } = await this.pool.query(
            `SELECT DISTINCT
                    h.id,
                    h.numero_de_historia AS "numeroDeHistoria",
                    h.nombre,
                    h.descripcion,
                    h.valor,
                    h.horas_estimadas,
                    h.factor_de_complejidad,
                    h.horas_calculadas,
                    h.asignado_al_sprint AS id_sprint,
                    ${colEstado}
            FROM scrumbird.historia_de_usuario h
            ${joinDev}
            WHERE h.asignado_al_sprint = $1::integer
            ${filtroDev}
            ORDER BY h.numero_de_historia ASC;`,
            params
        );
        return rows;
    }

    async finalizarReunion(idReunion) {
        const { rowCount } = await this.pool.query(
            `UPDATE scrumbird.reunion 
            SET estado = 'Finalizada' 
            WHERE id = $1;`,
            [idReunion]
        );
        return rowCount;
    }

    //funciones para la reunión de revisión

    //verifica que haya una reunión de planificación terminada del sprint
    async verificarPlanningConcluido(idSprint) {
        const { rows } = await this.pool.query(
            `SELECT COUNT(*) AS total 
            FROM scrumbird.reunion 
            WHERE id_sprint = $1 
            AND id_tipo_reunion = 2 
            AND estado = 'Finalizada';`,
            [idSprint]
        );
        return Number(rows[0].total) > 0;
    }
    
    //se obtienen las funciones que fueron terminadas en el sprint
    async obtenerHistoriasRevisionPorSprint(idSprint, idProyecto) {
        const { rows } = await this.pool.query(
            `SELECT h.id, 
                    h.numero_de_historia AS "numeroDeHistoria", 
                    h.nombre, 
                    h.descripcion, 
                    h.valor, 
                    h.horas_estimadas, 
                    h.factor_de_complejidad, 
                    h.asignado_al_sprint AS id_sprint,
                    h.estado_revision,
                    COALESCE(
                        (SELECT json_agg(json_build_object('id', c.id, 'descripcion', c.criterios_de_aceptacion))
                         FROM scrumbird.criterios_de_aceptacion c 
                         WHERE c.id_historia = h.id), 
                        '[]'::json
                    ) AS criterios
            FROM scrumbird.historia_de_usuario h
            WHERE h.asignado_al_sprint = $1::integer
              AND ($2::integer IS NULL OR h.id_proyecto = $2::integer)
              -- solo historias terminadas: debe existir al menos un registro de trabajo
              -- y ninguno puede estar en un estado distinto a terminado
              AND EXISTS (
                    SELECT 1 FROM scrumbird.trabajando_en_historia t
                    WHERE t.historia_asignada = h.id
                      AND t.id_proyecto = h.id_proyecto
              )
              AND NOT EXISTS (
                    SELECT 1 FROM scrumbird.trabajando_en_historia t
                    WHERE t.historia_asignada = h.id
                      AND t.id_proyecto = h.id_proyecto
                      AND LOWER(COALESCE(t.estado, 'por-empezar')) <> ALL($3::text[])
              )
            ORDER BY h.numero_de_historia ASC;`,
            [idSprint, idProyecto || null, ESTADOS_TERMINADA]
        );
        return rows;
    }

    //añade el comentario del cliente
    async actualizarRevisionHistoria(idHistoria, estadoRevision, comentario, idEmisor, idReunion, idProyecto) {
        //se guarda si el cliente aprobó o rechazó la historia
        const estado = String(estadoRevision || '').toUpperCase();
        if (['ACEPTADO', 'RECHAZADO'].includes(estado)) {
            await this.pool.query(
                `UPDATE scrumbird.historia_de_usuario
                 SET estado_revision = $1
                 WHERE id = $2::integer;`,
                [estado, idHistoria]
            );
        }

        if (comentario && comentario.trim() !== '') {
            await this.pool.query(
                `INSERT INTO scrumbird.comentario (emisor, id_historia, fecha_ultima_modificacion, contenido, id_proyecto)
                 VALUES ($1, $2, NOW(), $3, $4);`,
                [idEmisor, idHistoria, comentario, idProyecto]
            );
        }
    }

    async devolverHistoriaAProductBacklog(idHistoria) {
    //marcamos la historia como pendiente y desvinculamos del sprint asginado
    const { rowCount } = await this.pool.query(
        `UPDATE scrumbird.historia_de_usuario
         SET pendiente = true,
             asignado_al_sprint = NULL,
             estado_revision = 'PENDIENTE'
         WHERE id = $1;`,
        [idHistoria]
    );
    return rowCount;
    }

    //funciones para la daily scrum
    
    //respuestas publicadas de todos los participantes de esa reunión
    async obtenerDaily(idReunion) {
        const { rows: reu } = await this.pool.query(
            `SELECT id, id_proyecto, id_sprint, estado,
                    to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha
             FROM scrumbird.reunion
             WHERE id = $1::integer AND id_tipo_reunion = 1;`,
            [idReunion]
        );
        if (reu.length === 0) return null;
        const r = reu[0];

        const { rows: filas } = await this.pool.query(
            `SELECT rp.id_usuario AS "idUsuario", u.nombre AS autor, tp.rol, rp.anotaciones
             FROM scrumbird.reunion_participante rp
             JOIN scrumbird.usuario u ON u.id = rp.id_usuario
             LEFT JOIN scrumbird.trabajando_en_proyecto tp
                    ON tp.id_usuario = rp.id_usuario AND tp.id_proyecto = $2::integer
             WHERE rp.id_reunion = $1::integer
               AND rp.anotaciones IS NOT NULL AND rp.anotaciones <> '';`,
            [idReunion, r.id_proyecto]
        );

        const respuestas = filas
            .map(f => {
                try {
                    return { idUsuario: f.idUsuario, autor: f.autor, rol: f.rol, ...JSON.parse(f.anotaciones) };
                } catch (e) {
                    return null; //anotación que no pertenece a la daily
                }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.publicadoEn) - new Date(b.publicadoEn));

        const { rows: devs } = await this.pool.query(
            `SELECT COUNT(*) AS total
             FROM scrumbird.trabajando_en_proyecto
             WHERE id_proyecto = $1::integer AND LOWER(rol) = 'desarrollador';`,
            [r.id_proyecto]
        );

        const { rows: historial } = await this.pool.query(
            `SELECT id, to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha
             FROM scrumbird.reunion
             WHERE id_sprint = $1::integer AND id_tipo_reunion = 1
             ORDER BY fecha_inicio ASC, id ASC;`,
            [r.id_sprint]
        );

        return {
            reunion: { id: r.id, fecha: r.fecha, estado: r.estado, idSprint: r.id_sprint },
            respuestas,
            totalDesarrolladores: Number(devs[0].total),
            historial
        };
    }

    //guarda la respuesta; si hay impedimento, también lo registra en la tabla impedimento
    async guardarRespuestaDaily(idReunion, idUsuario, { ayer, hoy, tieneImpedimento, impedimento, idHistoria }) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: reu } = await client.query(
                `SELECT id_proyecto, id_sprint, estado FROM scrumbird.reunion
                 WHERE id = $1::integer AND id_tipo_reunion = 1;`,
                [idReunion]
            );
            if (reu.length === 0) throw new Error('Reunión no encontrada');
            if (String(reu[0].estado).toLowerCase() === 'finalizada') {
                throw new Error('La daily ya fue finalizada');
            }

            const anotaciones = JSON.stringify({
                ayer, hoy, tieneImpedimento, impedimento,
                idHistoria: idHistoria || null,
                publicadoEn: new Date().toISOString()
            });

            //UPDATE y luego INSERT: no depende de que exista una constraint única
            const upd = await client.query(
                `UPDATE scrumbird.reunion_participante
                 SET anotaciones = $3
                 WHERE id_reunion = $1::integer AND id_usuario = $2::integer;`,
                [idReunion, idUsuario, anotaciones]
            );
            if (upd.rowCount === 0) {
                await client.query(
                    `INSERT INTO scrumbird.reunion_participante (id_reunion, id_usuario, anotaciones)
                     VALUES ($1, $2, $3);`,
                    [idReunion, idUsuario, anotaciones]
                );
            }

            //estado en minúscula, igual que impedimentoDAO ('pendiente')
            if (tieneImpedimento) {
                await client.query(
                    `INSERT INTO scrumbird.impedimento
                        (id_proyecto, id_sprint, id_historia, id_usuario_reporta, descripcion, estado)
                    SELECT $1::int, $2::int, $3::int, $4::int, $5::text, 'pendiente'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM scrumbird.impedimento
                        WHERE id_sprint = $2::int
                        AND id_historia = $3::int
                        AND id_usuario_reporta = $4::int
                        AND LOWER(TRIM(descripcion)) = LOWER(TRIM($5::text))
                        AND LOWER(estado) = 'pendiente'
                    );`,
                    [reu[0].id_proyecto, reu[0].id_sprint, idHistoria, idUsuario, impedimento]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // ================= RETROSPECTIVA =================
    // Se guarda en reunion_participante.anotaciones, igual que la daily: una fila por usuario con
    // { tipo:'retro', notas:[{id,categoria,texto,creadaEn}], votos:[idNota], compromisos:[idNota] }
    // Cada persona solo escribe en su propia fila, así no se pisan entre sí.

    _parseRetro(texto) {
        try {
            const o = JSON.parse(texto);
            if (!o || o.tipo !== 'retro') return null;
            return {
                tipo: 'retro',
                notas: Array.isArray(o.notas) ? o.notas : [],
                votos: Array.isArray(o.votos) ? o.votos : [],
                compromisos: Array.isArray(o.compromisos) ? o.compromisos : []
            };
        } catch (e) {
            return null;
        }
    }

    //el facilitador puede estar guardado como 'facilitador' o 'scrum master'
    _esRolFacilitador(rol) {
        return /facilitador|scrum[\s_-]*master/i.test(String(rol || ''));
    }

    _errorNegocio(mensaje) {
        const err = new Error(mensaje);
        err.negocio = true;
        return err;
    }

    //notas de todo el equipo, con votos contados y compromisos marcados por el facilitador
    async obtenerRetrospectiva(idReunion, idUsuarioActual) {
        const { rows: reu } = await this.pool.query(
            `SELECT id, id_proyecto, id_sprint, estado
             FROM scrumbird.reunion
             WHERE id = $1::integer AND id_tipo_reunion = 3;`,
            [idReunion]
        );
        if (reu.length === 0) return null;
        const r = reu[0];

        const { rows: filas } = await this.pool.query(
            `SELECT rp.id_usuario AS "idUsuario", u.nombre AS autor, tp.rol, rp.anotaciones
             FROM scrumbird.reunion_participante rp
             JOIN scrumbird.usuario u ON u.id = rp.id_usuario
             LEFT JOIN scrumbird.trabajando_en_proyecto tp
                    ON tp.id_usuario = rp.id_usuario AND tp.id_proyecto = $2::integer
             WHERE rp.id_reunion = $1::integer
               AND rp.anotaciones IS NOT NULL AND rp.anotaciones <> '';`,
            [idReunion, r.id_proyecto]
        );

        const notas = [];
        const votosPorNota = new Map();
        const votadasPorMi = new Set();
        const comprometidas = new Set();

        for (const f of filas) {
            const datos = this._parseRetro(f.anotaciones);
            if (!datos) continue;

            datos.notas.forEach(n => notas.push({
                id: n.id,
                categoria: n.categoria,
                texto: n.texto,
                autor: f.autor,
                idAutor: f.idUsuario,
                creadaEn: n.creadaEn
            }));

            datos.votos.forEach(idNota => {
                votosPorNota.set(idNota, (votosPorNota.get(idNota) || 0) + 1);
                if (Number(f.idUsuario) === Number(idUsuarioActual)) votadasPorMi.add(idNota);
            });

            //solo cuenta el compromiso marcado por el facilitador
            if (this._esRolFacilitador(f.rol)) {
                datos.compromisos.forEach(idNota => comprometidas.add(idNota));
            }
        }

        notas.sort((a, b) => new Date(a.creadaEn) - new Date(b.creadaEn));

        return {
            reunion: { id: r.id, estado: r.estado, idSprint: r.id_sprint },
            notas: notas.map(n => ({
                ...n,
                votos: votosPorNota.get(n.id) || 0,
                votadoPorMi: votadasPorMi.has(n.id),
                compromiso: comprometidas.has(n.id)
            }))
        };
    }

    //lee la fila del usuario, aplica "mutar" y la guarda, todo en una transacción
    async _modificarRetroUsuario(idReunion, idUsuario, mutar, { soloFacilitador = false } = {}) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: reu } = await client.query(
                `SELECT id_proyecto, estado FROM scrumbird.reunion
                 WHERE id = $1::integer AND id_tipo_reunion = 3;`,
                [idReunion]
            );
            if (reu.length === 0) throw this._errorNegocio('Retrospectiva no encontrada');
            if (String(reu[0].estado).toLowerCase() === 'finalizada') {
                throw this._errorNegocio('La retrospectiva ya fue finalizada');
            }

            //solo el equipo Scrum participa (el cliente no)
            const { rows: miembro } = await client.query(
                `SELECT LOWER(rol) AS rol FROM scrumbird.trabajando_en_proyecto
                 WHERE id_usuario = $1::integer AND id_proyecto = $2::integer;`,
                [idUsuario, reu[0].id_proyecto]
            );
            if (miembro.length === 0 || miembro.some(m => String(m.rol).includes('cliente'))) {
                throw this._errorNegocio('La retrospectiva es exclusiva del equipo Scrum');
            }
            if (soloFacilitador && !miembro.some(m => this._esRolFacilitador(m.rol))) {
                throw this._errorNegocio('Solo el facilitador puede marcar compromisos');
            }

            const { rows } = await client.query(
                `SELECT anotaciones FROM scrumbird.reunion_participante
                 WHERE id_reunion = $1::integer AND id_usuario = $2::integer
                 FOR UPDATE;`,
                [idReunion, idUsuario]
            );

            const actual = this._parseRetro(rows[0]?.anotaciones)
                || { tipo: 'retro', notas: [], votos: [], compromisos: [] };
            const nuevo = mutar(actual) || actual;
            const json = JSON.stringify(nuevo);

            if (rows.length === 0) {
                await client.query(
                    `INSERT INTO scrumbird.reunion_participante (id_reunion, id_usuario, anotaciones)
                     VALUES ($1, $2, $3);`,
                    [idReunion, idUsuario, json]
                );
            } else {
                await client.query(
                    `UPDATE scrumbird.reunion_participante
                     SET anotaciones = $3
                     WHERE id_reunion = $1::integer AND id_usuario = $2::integer;`,
                    [idReunion, idUsuario, json]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async agregarNotaRetro(idReunion, idUsuario, { categoria, texto }) {
        if (!['bien', 'mejorar', 'acciones'].includes(categoria)) {
            throw this._errorNegocio('Categoría no válida');
        }
        const limpio = String(texto || '').trim();
        if (!limpio) throw this._errorNegocio('Escribe una nota antes de agregarla.');
        if (limpio.length > 500) throw this._errorNegocio('La nota no puede pasar de 500 caracteres.');

        const id = `${idUsuario}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await this._modificarRetroUsuario(idReunion, idUsuario, (d) => {
            d.notas.push({ id, categoria, texto: limpio, creadaEn: new Date().toISOString() });
        });
        return id;
    }

    //un voto por persona por nota: si ya votó, lo quita
    async alternarVotoRetro(idReunion, idUsuario, idNota) {
        await this._modificarRetroUsuario(idReunion, idUsuario, (d) => {
            d.votos = d.votos.includes(idNota) ? d.votos.filter(v => v !== idNota) : [...d.votos, idNota];
        });
    }

    //solo el facilitador
    async alternarCompromisoRetro(idReunion, idUsuario, idNota) {
        await this._modificarRetroUsuario(idReunion, idUsuario, (d) => {
            d.compromisos = d.compromisos.includes(idNota)
                ? d.compromisos.filter(v => v !== idNota)
                : [...d.compromisos, idNota];
        }, { soloFacilitador: true });
    }
}

module.exports = reunionDAO;