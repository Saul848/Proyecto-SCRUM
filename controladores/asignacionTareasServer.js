// se manejan los eventos de la parte de reuniones
function setupAsignacionTareasSockets(io) {
    // Compartido por todos los sockets conectados a este servidor
    const estadoFasePorSprint = new Map(); // sprintId -> { fase, data }

    io.on("connection", (socket) => {
        console.log(`Conectado a asignación de tareas: ${socket.id}`);

        // Guardar rol si viene en handshake query (opcional pero útil para filtrar cliente)
        const rolHandshake = String(socket.handshake?.query?.rol || "").toLowerCase();
        if (rolHandshake) {
            socket.data.rol = rolHandshake;
        }

        socket.on("registrar-rol-reunion", ({ rol }) => {
            socket.data.rol = String(rol || "").toLowerCase();
        });

        // unirse a la sala del sprint actual
        socket.on("join-asignacion-sprint", ({ sprintId }) => {
            const idSprintNum = Number(sprintId);
            if (!idSprintNum) return;

            for (const sala of socket.rooms) {
                if (sala.startsWith("sprint-")) socket.leave(sala);
            }
            socket.join(`sprint-${idSprintNum}`);
            console.log(`Socket ${socket.id} se unió a sprint-${idSprintNum}`);

            // Sincronizar solo fases que no provocan recarga de página
            const faseActiva = estadoFasePorSprint.get(idSprintNum);
            const esCliente = String(socket.data.rol || "").includes("cliente");
            if (faseActiva && !esCliente) {
                if (faseActiva.fase === "fase-2") {
                    socket.emit("fase-2-cliente", faseActiva.data || {});
                } else if (faseActiva.fase === "fase-1") {
                    socket.emit("fase-1-cliente", faseActiva.data || {});
                }
            }
        });

        // el desarrollador solicita una historia
        socket.on("solicitar-historia", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("notificar-solicitud", data);
        });

        // el facilitador gestiona (Acepta o Rechaza) la solicitud
        socket.on("gestionar-solicitud", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("actualizar-estado-asignacion", data);

            if (data.aceptada) {
                io.to(`sprint-${data.sprintId}`).emit("notificacion-asignacion-exitosa", {
                    idDesarrollador: data.idDesarrollador,
                    nombreHistoria: data.nombreHistoria || `PB-${data.idHistoria}`
                });
            }
        });

        // sincroniza apertura de Planning Poker entre facilitador y desarrolladores
        socket.on("disparar-planning-poker", ({ sprintId }) => {
            io.to(`sprint-${sprintId}`).emit("abrir-planning-poker-cliente");
        });

        socket.on("disparar-volver-detalles", (data = {}) => {
            const idSprintNum = Number(data.sprintId);
            if (idSprintNum) {
                estadoFasePorSprint.delete(idSprintNum);
            }
            socket.to(`sprint-${idSprintNum}`).emit("volver-detalles-cliente", data);
        });

        socket.on("disparar-fase-2", (data = {}) => {
            const idSprintNum = Number(data.sprintId);
            if (idSprintNum) {
                estadoFasePorSprint.set(idSprintNum, { fase: "fase-2", data });
            }
            io.to(`sprint-${idSprintNum}`).emit("fase-2-cliente", data);
        });

        socket.on("disparar-fase-1", (data = {}) => {
            const idSprintNum = Number(data.sprintId);
            if (idSprintNum) {
                estadoFasePorSprint.set(idSprintNum, { fase: "fase-1", data });
            }
            io.to(`sprint-${idSprintNum}`).emit("fase-1-cliente", data);
        });

        socket.on("disparar-confirmar-sprint", (data = {}) => {
            const idSprintNum = Number(data.sprintId);
            if (idSprintNum) {
                estadoFasePorSprint.delete(idSprintNum);
            }

            const sala = io.sockets.adapter.rooms.get(`sprint-${idSprintNum}`);
            if (!sala) return;

            for (const socketId of sala) {
                const clienteSocket = io.sockets.sockets.get(socketId);
                const rol = String(clienteSocket?.data?.rol || "").toLowerCase();
                if (clienteSocket && !rol.includes("cliente")) {
                    clienteSocket.emit("confirmar-sprint-cliente", data);
                }
            }
        });

        // Retransmitir cambios en el factor o en las horas estimadas de la historia
        socket.on("actualizar-factor-historia", (data) => {
            socket.to(`sprint-${data.sprintId}`).emit("cambio-factor-historia-cliente", data);
        });

        // Retransmitir cambios de las fechas de la iteración
        socket.on("disparar-cambio-fechas", (data) => {
            socket.to(`sprint-${data.sprintId}`).emit("cambio-fechas-cliente", data);
        });

        // el cliente cerró el acta de revisión: avisar al equipo
        socket.on("cliente-cerro-acta-revision", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("acta-revision-cerrada-cliente", data);
        });

        // daily scrum: alguien publicó su reporte
        socket.on("publicar-daily", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("daily-actualizada", data);
        });

        // daily scrum: el facilitador la finalizó
        socket.on("disparar-finalizar-daily", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("daily-finalizada-cliente", data);
        });

        // retrospectiva: alguien agregó una nota, votó o marcó un compromiso
        socket.on("publicar-retro", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("retro-actualizada", data);
        });

        // retrospectiva: el facilitador la finalizó
        socket.on("disparar-finalizar-retro", (data) => {
            io.to(`sprint-${data.sprintId}`).emit("retro-finalizada-cliente", data);
        });

        socket.on("disconnect", () => {
            console.log(`Desconectado de asignación de tareas: ${socket.id}`);
        });
    });
}

module.exports = setupAsignacionTareasSockets;