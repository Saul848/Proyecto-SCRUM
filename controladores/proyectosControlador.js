const { enviarInvitacionProyecto } = require('../utils/emailService');
const { crearCarpetaProyecto } = require('../utils/fileSystemHelper'); // <-- Importar helper

class ProyectosControlador {
    constructor(proyectosDAO) {
        this.dao = proyectosDAO;
    }

    async listarUsuarios(req, res) {
        try {
            const usuarios = await this.dao.listarUsuariosDisponibles();
            res.status(200).json({ ok: true, data: usuarios });
        } catch (err) {
            console.error("Error al listar usuarios:", err.message);
            res.status(500).json({ ok: false, mensaje: "Error al obtener la lista de usuarios" });
        }
    }

    async crear(req, res) {
        try {
            const { nombre, creador, duracion, colaboradores } = req.body;

            if (!nombre) {
                return res.status(400).json({ 
                    ok: false, 
                    mensaje: "El nombre del proyecto es obligatorio." 
                });
            }

            // 1. Crear el proyecto en la BD
            const nuevoProyecto = await this.dao.crearProyectoConColaboradores({
                nombre,
                creador: creador || 1,
                duracion: duracion || "No especificada",
                colaboradores: colaboradores || [] 
            });

            // 2. Enviar correos reales
            if (colaboradores && colaboradores.length > 0) {
                for (const colab of colaboradores) {
                    try {
                        await enviarInvitacionProyecto({
                            correoDestino: colab.correo,
                            nombreProyecto: nombre,
                            rol: colab.rol,
                            idProyecto: nuevoProyecto.id,
                            idUsuario: colab.id_usuario
                        });
                        console.log(`Correo enviado con éxito a: ${colab.correo}`);
                    } catch (emailErr) {
                        console.error(`Error enviando correo a ${colab.correo}:`, emailErr.message);
                    }
                }
            }

            // Crear físicamente la carpeta del proyecto en el servidor PARA EVIDENCIAS
            if (nuevoProyecto.id) {
                crearCarpetaProyecto(nuevoProyecto.id);
            }

            res.status(201).json({
                ok: true,
                mensaje: "Proyecto creado e invitaciones enviadas por correo con éxito.",
                data: nuevoProyecto
            });
        } catch (err) {
            console.error("Error al crear el proyecto:", err.message);
            res.status(500).json({ 
                ok: false, 
                mensaje: "Error interno del servidor al procesar el proyecto", 
                error: err.message 
            });
        }
    }

    async responderInvitacion(req, res) {
        try {
            const { accion, idProyecto, idUsuario, rol } = req.query;

            if (accion === 'aceptar') {
                await this.dao.agregarColaboradorAceptado({
                    id_usuario: parseInt(idUsuario),
                    id_proyecto: parseInt(idProyecto),
                    rol: rol || 'Developer'
                });
                return res.send(`
                    <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                        <h1 style="color: #28a745;">¡Invitación Aceptada!</h1>
                        <p>Te has unido exitosamente al proyecto. Ya puedes cerrar esta ventana.</p>
                    </div>
                `);
            } else if (accion === 'rechazar') {
                return res.send(`
                    <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                        <h1 style="color: #dc3545;">Invitación Rechazada</h1>
                        <p>Has declinado la invitación a este proyecto. Gracias por avisar.</p>
                    </div>
                `);
            }

            res.status(400).send("Acción no válida.");
        } catch (err) {
            console.error("Error al procesar la respuesta:", err.message);
            res.status(500).send("Ocurrió un error al procesar tu respuesta.");
        }
    }
}

module.exports = ProyectosControlador;