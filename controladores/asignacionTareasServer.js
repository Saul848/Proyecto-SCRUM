const { Server } = require("socket.io");

function setupAsignacionTareasSockets(server) {
    const io = new Server(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
        console.log(`Conectado a asignación de tareas: ${socket.id}`);

        //unirse a la sala del sprint actual
        socket.on("join-asignacion-sprint", ({ sprintId }) => {
            socket.join(`sprint-${sprintId}`);
        });

        //el desarrollador solicita una historia
        socket.on("solicitar-historia", (data) => {
            //reenviamos a todos en la sala del sprint (el facilitador lo recibirá)
            io.to(`sprint-${data.sprintId}`).emit("notificar-solicitud", data);
        });

        //el facilitador gestiona (Acepta o Rechaza) la solicitud
        socket.on("gestionar-solicitud", (data) => {
            //llamamos al DAO para guardar el cambio en la BD permanentemente
            
            //reenviamos el cambio de estado a todos los usuarios de la sala
            io.to(`sprint-${data.sprintId}`).emit("actualizar-estado-asignacion", data);
        });

        //sincroniza apertura de Planning Poker entre facilitador y desarrolladores
        socket.on("disparar-planning-poker", ({ sprintId }) => {
            io.to(`sprint-${sprintId}`).emit("abrir-planning-poker-cliente");
        });

        socket.on("disparar-volver-detalles", (data) => {
        // Reenvía la señal a todos los usuarios conectados en la sala de ese sprint
        io.to(`sprint-${data.sprintId}`).emit("volver-detalles-cliente");
        });

        socket.on("disparar-fase-2", (data) => {
        io.to(`sprint-${data.sprintId}`).emit("fase-2-cliente");
        });

        socket.on("disparar-fase-1", (data) => {
        io.to(`sprint-${data.sprintId}`).emit("fase-1-cliente");
        });

        socket.on("disparar-confirmar-sprint", (data) => {
        io.to(`sprint-${data.sprintId}`).emit("confirmar-sprint-cliente", data);
        });

        // Retransmitir cambios en el factor o en las horas estimadas de la historia
        socket.on("actualizar-factor-historia", (data) => {
        socket.to(`sprint-${data.sprintId}`).emit("cambio-factor-historia-cliente", data);
        });

        // Retransmitir cambios de las fechas de la iteración
        socket.on("disparar-cambio-fechas", (data) => {
        socket.to(`sprint-${data.sprintId}`).emit("cambio-fechas-cliente", data);
        });

        socket.on("disconnect", () => {
            console.log(`Desconectado de asignación de tareas: ${socket.id}`);
        });
    });
}

module.exports = setupAsignacionTareasSockets;