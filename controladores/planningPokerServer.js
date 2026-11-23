const pool = require('../poolDb'); // aqui mismo en las rutas se exporta { pool }
const HistoriaUsuarioDAO = require('../dao/historiaUsuarioDAO');

const historiaDao = new HistoriaUsuarioDAO(pool);

/**
 * Registra los eventos de Planning Poker sobre una instancia de Socket.IO
 * ya creada en server.js (NO crea su propio Server).
 * @param {import("socket.io").Server} io
 */
function setupPlanningPokerSockets(io) {
    const activeSessions = {};

    io.on("connection", (socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        // 1. Unirse e inicializar sesión
        socket.on("join-planning-session", async ({ sprintId, user, role, stories }) => {
            if (!user) return;

            let session = activeSessions[sprintId];

            if (!session) {
                // Solo el facilitador puede crear la sesión
                if (role !== 'facilitador') {
                    socket.emit(
                        "session-not-found",
                        "Aún no hay una sesión de Planning Poker activa. Espera a que el facilitador la inicie."
                    );
                    return;
                }

                session = activeSessions[sprintId] = {
                    currentStoryIndex: 0,
                    stories: stories || [],
                    status: "VOTING",
                    votes: {},
                    participants: []
                };
            } else if (role === 'facilitador' && stories?.length && session.stories.length === 0) {
                // Por si la sesión existiera sin historias
                session.stories = stories;
            }

            socket.join(sprintId);
            socket.sprintId = sprintId;

            const existingParticipant = session.participants.find(p => p.id === user.id);
            if (!existingParticipant) {
                session.participants.push({ id: user.id, name: user.name || user.nombre, role, socketId: socket.id });
            } else {
                existingParticipant.socketId = socket.id;
                existingParticipant.role = role;
            }

            // Filtrar estrictamente solo a los desarrolladores para la votación
            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            if (session.stories.length > 0) {
                socket.emit("sync-session-state", {
                    currentStory: session.stories[session.currentStoryIndex],
                    status: session.status,
                    storyIndex: session.currentStoryIndex,
                    totalStories: session.stories.length,
                    participants: desarrolladores,
                    votes: session.votes
                });
            }

            io.to(sprintId).emit("update-session-users", {
                participants: desarrolladores,
                votes: session.votes
            });
        });

        // 2. Registrar voto (Validando estrictamente que sea desarrollador)
        socket.on("submit-vote", ({ sprintId, userId, voteValue }) => {
            const session = activeSessions[sprintId];
            if (!session || session.status !== "VOTING") return;

            const participant = session.participants.find(p => p.id === userId);

            // Si el usuario no existe o no es desarrollador, rechazamos el voto
            if (!participant || participant.role !== 'desarrollador') return;

            session.votes[userId] = { userId, name: participant.name, vote: voteValue, hasVoted: true };

            const totalVoted = Object.keys(session.votes).length;
            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            // Notificamos a todos el progreso y el listado actualizado de desarrolladores
            io.to(sprintId).emit("vote-progress", {
                totalVoted,
                totalParticipants: desarrolladores.length,
                participants: desarrolladores,
                votes: session.votes
            });
        });

        // 2.5 Repetir votación (Limpiar votos de la historia actual)
        socket.on("repeat-vote", ({ sprintId }) => {
            const session = activeSessions[sprintId];
            if (!session) return;

            session.votes = {};
            session.status = "VOTING";

            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            io.to(sprintId).emit("vote-reset", {
                status: session.status,
                participants: desarrolladores,
                votes: session.votes
            });
        });

        // 3. Revelar cartas (con conteo estadístico y recomendación automática)
        socket.on("reveal-cards", ({ sprintId }) => {
            const session = activeSessions[sprintId];
            if (!session) return;

            session.status = "REVEALED";
            const voteValues = Object.values(session.votes).map(v => v.vote);
            const numericVotes = voteValues.filter(v => !isNaN(v) && v !== 'UNKNOWN' && v !== 'BREAK' && v !== '?' && v !== '☕');

            let average = 0;
            if (numericVotes.length > 0) {
                const sum = numericVotes.reduce((acc, val) => acc + parseFloat(val), 0);
                average = (sum / numericVotes.length).toFixed(1);
            }

            // Conteo exacto por cada opción de la baraja
            const counts = {
                "0": 0, "1": 0, "2": 0, "3": 0, "5": 0, "8": 0, "13": 0, "21": 0, "34": 0, "55": 0, "89": 0, "?": 0, "☕": 0
            };

            voteValues.forEach(v => {
                let key = v;
                if (v === "UNKNOWN") key = "?";
                if (v === "BREAK") key = "☕";
                if (counts[key] !== undefined) {
                    counts[key]++;
                } else {
                    counts[key] = 1;
                }
            });

            // Recomendación basada en el menor y mayor puntaje numérico votado
            let recomendacionTexto = "Todos votaron similar o no hay suficientes votos numéricos.";
            if (numericVotes.length > 0) {
                const nums = numericVotes.map(Number).sort((a, b) => a - b);
                const minVal = nums[0];
                const maxVal = nums[nums.length - 1];
                if (minVal !== maxVal) {
                    recomendacionTexto = `Pidan a quienes votaron ${minVal} y ${maxVal} que expliquen su razonamiento.`;
                } else {
                    recomendacionTexto = `¡Consenso absoluto en ${minVal}! Pueden confirmar la estimación.`;
                }
            }

            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            io.to(sprintId).emit("cards-revealed", {
                participants: desarrolladores,
                votes: session.votes,
                average,
                numericVotesCount: numericVotes.length,
                voteCounts: counts,
                recommendation: recomendacionTexto
            });
        });

        // 4. Siguiente historia (Confirmar y pasar)
        socket.on("next-story", async ({ sprintId, finalStoryPoints, finalHours }) => {
            const session = activeSessions[sprintId];
            if (!session) return;

            const currentStory = session.stories[session.currentStoryIndex];
            if (currentStory && currentStory.id &&
                finalStoryPoints !== undefined && finalHours !== undefined) {
                try {
                    await historiaDao.actualizarEstimacionHistoria(currentStory.id, {
                        puntos: finalStoryPoints,
                        horas: finalHours
                    });
                } catch (error) {
                    console.error("Error al guardar la estimación de la historia:", error);
                }
            }

            session.votes = {};
            session.status = "VOTING";
            session.currentStoryIndex++;

            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            if (session.currentStoryIndex >= session.stories.length) {
                // Fin de todas las historias
                io.to(sprintId).emit("session-finished");
                delete activeSessions[sprintId];
            } else {
                io.to(sprintId).emit("load-next-story", {
                    currentStory: session.stories[session.currentStoryIndex],
                    storyIndex: session.currentStoryIndex,
                    totalStories: session.stories.length,
                    participants: desarrolladores,
                    votes: session.votes
                });
            }
        });

        // 5. Saltar votación actual sin guardar puntos
        socket.on("skip-story", async ({ sprintId }) => {
            const session = activeSessions[sprintId];
            if (!session) return;

            session.votes = {};
            session.status = "VOTING";
            session.currentStoryIndex++;

            const desarrolladores = session.participants.filter(p => p.role === 'desarrollador');

            if (session.currentStoryIndex >= session.stories.length) {
                io.to(sprintId).emit("session-finished");
                delete activeSessions[sprintId];
            } else {
                io.to(sprintId).emit("load-next-story", {
                    currentStory: session.stories[session.currentStoryIndex],
                    storyIndex: session.currentStoryIndex,
                    totalStories: session.stories.length,
                    participants: desarrolladores,
                    votes: session.votes
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Usuario desconectado: ${socket.id}`);
        });
    });
}

module.exports = setupPlanningPokerSockets;