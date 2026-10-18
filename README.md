# Proyecto-SCRUM
Proyecto para la matería Gestión de Procesos de Desarrollo de Software (GPDS)

Script realizado en la BD

CREATE SCHEMA ScrumBird;
SET search_path TO ScrumBird, public;

CREATE TABLE Usuario (
    ID INT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    CorreoElectronico VARCHAR(255),
	NombreDeUsuario VARCHAR (255) NOT NULL
);

CREATE TABLE Proyecto (
    ID INT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Creador INT,
    FechaCreacion DATE,
    Duracion VARCHAR(100),
    FOREIGN KEY (Creador) REFERENCES Usuario(ID)
);

CREATE TABLE TrabajandoEnProyecto (
    IDUsuario INT,
    IDProyecto INT,
    Rol VARCHAR(100),
    PRIMARY KEY (IDUsuario, IDProyecto),
    FOREIGN KEY (IDUsuario) REFERENCES Usuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (IDProyecto) REFERENCES Proyecto(ID) ON DELETE CASCADE
);

CREATE TABLE Mensaje (
    ID INT PRIMARY KEY,
    IDAutor INT,
    IDUsuarioDestino INT,
    Fecha TIMESTAMP NOT NULL, --Fecha y hora exacta
    Mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (IDAutor) REFERENCES Usuario(ID),
    FOREIGN KEY (IDUsuarioDestino) REFERENCES Usuario(ID)
);

CREATE TABLE Grupo (
    ID INT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Descripcion VARCHAR(255)
);

CREATE TABLE EstaEnGrupo (
	IDUsuario INT,
	IDGrupo INT,
	rol VARCHAR(255) NOT NULL,
    PRIMARY KEY (IDUsuario, IDGrupo),
    FOREIGN KEY (IDUsuario) REFERENCES Usuario(ID),
    FOREIGN KEY (IDGrupo) REFERENCES Grupo(ID)	
)

CREATE TABLE MensajeGrupo (
    ID INT PRIMARY KEY,
    IDAutor INT,
    IDGrupoDestino INT,
    Fecha TIMESTAMP NOT NULL,
    Mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (IDAutor) REFERENCES Usuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (IDGrupoDestino) REFERENCES Grupo(ID) ON DELETE CASCADE
);

CREATE TABLE Sprint (
    ID INT PRIMARY KEY,
    NoIteracion INT NOT NULL,
    Objetivo VARCHAR(255) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    IDProyecto INT NOT NULL,
    FOREIGN KEY (IDProyecto) REFERENCES Proyecto(ID) ON DELETE CASCADE
);

CREATE TABLE HistoriaDeUsuario (
    ID INT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Descripcion VARCHAR(255) NOT NULL,
    CriteriosDeAceptacion VARCHAR(255) NOT NULL,
    Valor INT NOT NULL,
    PuntosDeHistoria INT,
    FactorDeComplejidad DOUBLE PRECISION,
    CosteEstimado INT,
    IDProyecto INT,
    AsignadoAlSprint INT,
    FOREIGN KEY (IDProyecto) REFERENCES Proyecto(ID) ON DELETE CASCADE,
    FOREIGN KEY (AsignadoAlSprint) REFERENCES Sprint(ID) ON DELETE SET NULL
);

CREATE TABLE Comentario (
    ID INT PRIMARY KEY,
    Emisor INT NOT NULL,
    IDHistoria INT NOT NULL,
    FechaUltimaModificacion DATE NOT NULL,
    Contenido VARCHAR(255) NOT NULL,
    IDProyecto INT,
    FOREIGN KEY (Emisor) REFERENCES Usuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (IDHistoria) REFERENCES HistoriaDeUsuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (IDProyecto) REFERENCES Proyecto(ID) ON DELETE CASCADE
);

CREATE TABLE TrabajandoEnHistoria (
    ID INT PRIMARY KEY,
    Responsable INT NOT NULL,
    HistoriaAsignada INT NOT NULL,
    Estado VARCHAR(100) NOT NULL,
    EvidenciasDesarrollo VARCHAR(255),
    IDProyecto INT NOT NULL,
    FOREIGN KEY (Responsable) REFERENCES Usuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (HistoriaAsignada) REFERENCES HistoriaDeUsuario(ID) ON DELETE CASCADE,
    FOREIGN KEY (IDProyecto) REFERENCES Proyecto(ID) ON DELETE CASCADE
);

-- ==========================================
-- 1. TABLA: Usuario
-- ==========================================
INSERT INTO Usuario (ID, Nombre, Password, CorreoElectronico, NombreDeUsuario) VALUES
(1, 'Ana Pérez', 'pass123', 'ana@example.com', 'ana_p'),
(2, 'Carlos Gómez', 'pass456', 'carlos@example.com', 'carlos_g'),
(3, 'Sofía Ruiz', 'pass789', 'sofia@example.com', 'sofia_r');

-- ==========================================
-- 2. TABLA: Grupo
-- ==========================================
INSERT INTO Grupo (ID, Nombre, Descripcion) VALUES
(1, 'Equipo Frontend', 'Desarrolladores de la interfaz de usuario'),
(2, 'Equipo Backend', 'Desarrolladores de servicios y base de datos'),
(3, 'Equipo QA', 'Control de calidad y pruebas de software');

-- ==========================================
-- 3. TABLA: Proyecto
-- ==========================================
INSERT INTO Proyecto (ID, Nombre, Creador, FechaCreacion, Duracion) VALUES
(1, 'ScrumBird Web', 1, '2026-01-10', '3 meses'),
(2, 'App Móvil ScrumBird', 2, '2026-02-15', '4 meses'),
(3, 'Portal de Reportes', 3, '2026-03-01', '2 meses');

-- ==========================================
-- 4. TABLA: TrabajandoEnProyecto
-- ==========================================
INSERT INTO TrabajandoEnProyecto (IDUsuario, IDProyecto, Rol) VALUES
(1, 1, 'Product Owner'),
(2, 2, 'Scrum Master'),
(3, 3, 'Developer');

-- ==========================================
-- 5. TABLA: Mensaje
-- ==========================================
INSERT INTO Mensaje (ID, IDAutor, IDUsuarioDestino, Fecha, Mensaje) VALUES
(1, 1, 2, '2026-10-18 09:00:00', 'Hola Carlos, ¿cómo va el avance del sprint?'),
(2, 2, 1, '2026-10-18 09:05:00', 'Hola Ana, todo en orden por aquí.'),
(3, 3, 1, '2026-10-18 10:30:00', 'Ana, ¿puedes revisar los pendientes?');

-- ==========================================
-- 6. TABLA: EstaEnGrupo
-- ==========================================
INSERT INTO EstaEnGrupo (IDUsuario, IDGrupo, rol) VALUES
(1, 1, 'Líder técnico'),
(2, 2, 'Colaborador'),
(3, 3, 'Tester principal');

-- ==========================================
-- 7. TABLA: MensajeGrupo
-- ==========================================
INSERT INTO MensajeGrupo (ID, IDAutor, IDGrupoDestino, Fecha, Mensaje) VALUES
(1, 1, 1, '2026-10-18 11:00:00', 'Bienvenidos a la reunión del equipo frontend'),
(2, 2, 2, '2026-10-18 11:15:00', 'Actualización de la base de datos completada'),
(3, 3, 3, '2026-10-18 11:30:00', 'Casos de prueba subidos al repositorio');

-- ==========================================
-- 8. TABLA: Sprint
-- ==========================================
INSERT INTO Sprint (ID, NoIteracion, Objetivo, FechaInicio, FechaFin, IDProyecto) VALUES
(1, 1, 'Configuración inicial y login', '2026-01-10', '2026-01-24', 1),
(2, 1, 'Estructura base de la app móvil', '2026-02-15', '2026-03-01', 2),
(3, 1, 'Diseño de base de datos de reportes', '2026-03-01', '2026-03-15', 3);

-- ==========================================
-- 9. TABLA: HistoriaDeUsuario
-- ==========================================
INSERT INTO HistoriaDeUsuario (ID, Nombre, Descripcion, CriteriosDeAceptacion, Valor, PuntosDeHistoria, FactorDeComplejidad, CosteEstimado, IDProyecto, AsignadoAlSprint) VALUES
(1, 'Autenticación', 'Permitir iniciar sesión', 'Validar credenciales correctamente', 10, 5, 1.5, 3, 1, 1),
(2, 'Splash Screen', 'Mostrar pantalla de carga', 'Duración de 2 segundos sin bloqueos', 5, 3, 1.0, 2, 2, 2),
(3, 'Exportar PDF', 'Exportar datos a formato PDF', 'Descarga correcta del archivo', 8, 8, 2.0, 5, 3, 3);

-- ==========================================
-- 10. TABLA: Comentario
-- ==========================================
INSERT INTO Comentario (ID, Emisor, IDHistoria, FechaUltimaModificacion, Contenido, IDProyecto) VALUES
(1, 1, 1, '2026-10-18', 'Excelente avance en el login', 1),
(2, 2, 2, '2026-10-18', 'Falta afinar la resolución de la imagen', 2),
(3, 3, 3, '2026-10-18', 'Revisar la paginación del reporte', 3);

-- ==========================================
-- 11. TABLA: TrabajandoEnHistoria
-- ==========================================
INSERT INTO TrabajandoEnHistoria (ID, Responsable, HistoriaAsignada, Estado, EvidenciasDesarrollo, IDProyecto) VALUES
(1, 1, 1, 'En proceso', 'commit_hash_123', 1),
(2, 2, 2, 'Completado', 'commit_hash_456', 2),
(3, 3, 3, 'Pendiente', 'sin evidencias', 3);

SELECT * FROM ScrumBird.Usuario;
SELECT * FROM ScrumBird.Grupo;
SELECT * FROM ScrumBird.TrabajandoEnProyecto;
SELECT * FROM ScrumBird.Mensaje;
SELECT * FROM ScrumBird.EstaEnGrupo;
SELECT * FROM ScrumBird.MensajeGrupo;
SELECT * FROM ScrumBird.Sprint;
SELECT * FROM ScrumBird.HistoriaDeUsuario;
SELECT * FROM ScrumBird.Comentario;
SELECT * FROM ScrumBird.TrabajandoEnHistoria;
