// 1. Importar las clases de mensajes
const mensajeDDAO = require('../dao/mensajesDDAO'); 
const mensajeDControlador = require('../controladores/mensajesDControlador');

// 2. Inicializar las instancias 
const instanciaMensajeDDAO = new mensajeDDAO(pool);
const instanciaMensajeDControlador = new mensajeDControlador(instanciaMensajeDDAO);

// 3. Declarar las rutas que usa JavaScript
app.get('/mensajes/grupo/:idGrupo', (req, res) => instanciaMensajeDControlador.listarMensajesGrupo(req, res));
app.post('/mensajes/grupo', (req, res) => instanciaMensajeDControlador.enviarMensajeGrupo(req, res));