# Proyecto-SCRUM
Proyecto para la matería Gestión de Procesos de Desarrollo de Software (GPDS)

Script realizado en la BD

-- ==========================================
-- ELIMINAR Y CREAR ESQUEMA
-- ==========================================

DROP SCHEMA IF EXISTS scrumbird CASCADE;

CREATE SCHEMA scrumbird;

SET search_path TO scrumbird, public;


-- ==========================================
-- 1. TABLA: usuario
-- ==========================================

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255),
    nombre_de_usuario VARCHAR(255) NOT NULL
);


-- ==========================================
-- 2. TABLA: proyecto
-- ==========================================

CREATE TABLE proyecto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    creador INT,
    fecha_creacion DATE,
    duracion VARCHAR(100),
    FOREIGN KEY (creador)
        REFERENCES usuario(id)
);


-- ==========================================
-- 3. TABLA: trabajando_en_proyecto
-- Llave primaria compuesta: NO modificar
-- ==========================================

CREATE TABLE trabajando_en_proyecto (
    id_usuario INT,
    id_proyecto INT,
    rol VARCHAR(100),
    PRIMARY KEY (id_usuario, id_proyecto),
    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 4. TABLA: mensaje
-- ==========================================

CREATE TABLE mensaje (
    id SERIAL PRIMARY KEY,
    id_autor INT,
    id_usuario_destino INT,
    fecha TIMESTAMP NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_autor)
        REFERENCES usuario(id),
    FOREIGN KEY (id_usuario_destino)
        REFERENCES usuario(id)
);


-- ==========================================
-- 5. TABLA: grupo
-- ==========================================

CREATE TABLE grupo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255)
);


-- ==========================================
-- 6. TABLA: esta_en_grupo
-- Llave primaria compuesta: NO modificar
-- ==========================================

CREATE TABLE esta_en_grupo (
    id_usuario INT,
    id_grupo INT,
    rol VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_usuario, id_grupo),
    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id),
    FOREIGN KEY (id_grupo)
        REFERENCES grupo(id)
);


-- ==========================================
-- 7. TABLA: mensaje_grupo
-- ==========================================

CREATE TABLE mensaje_grupo (
    id SERIAL PRIMARY KEY,
    id_autor INT,
    id_grupo_destino INT,
    fecha TIMESTAMP NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_autor)
        REFERENCES usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (id_grupo_destino)
        REFERENCES grupo(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 8. TABLA: sprint
-- ==========================================

CREATE TABLE sprint (
    id SERIAL PRIMARY KEY,
    no_iteracion INT NOT NULL,
    objetivo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_proyecto INT NOT NULL,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 9. TABLA: historia_de_usuario
-- ==========================================

CREATE TABLE historia_de_usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    criterios_de_aceptacion VARCHAR(255) NOT NULL,
    valor INT NOT NULL,
    puntos_de_historia INT,
    factor_de_complejidad DOUBLE PRECISION,
    coste_estimado INT,
    id_proyecto INT,
    asignado_al_sprint INT,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id)
        ON DELETE CASCADE,
    FOREIGN KEY (asignado_al_sprint)
        REFERENCES sprint(id)
        ON DELETE SET NULL
);


-- ==========================================
-- 10. TABLA: comentario
-- ==========================================

CREATE TABLE comentario (
    id SERIAL PRIMARY KEY,
    emisor INT NOT NULL,
    id_historia INT NOT NULL,
    fecha_ultima_modificacion DATE NOT NULL,
    contenido VARCHAR(255) NOT NULL,
    id_proyecto INT,
    FOREIGN KEY (emisor)
        REFERENCES usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (id_historia)
        REFERENCES historia_de_usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id)
        ON DELETE CASCADE
);


-- ==========================================
-- 11. TABLA: trabajando_en_historia
-- ==========================================

CREATE TABLE trabajando_en_historia (
    id SERIAL PRIMARY KEY,
    responsable INT NOT NULL,
    historia_asignada INT NOT NULL,
    estado VARCHAR(100) NOT NULL,
    evidencias_desarrollo VARCHAR(255),
    id_proyecto INT NOT NULL,
    FOREIGN KEY (responsable)
        REFERENCES usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (historia_asignada)
        REFERENCES historia_de_usuario(id)
        ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto)
        REFERENCES proyecto(id)
        ON DELETE CASCADE
);


-- ==========================================
-- INSERTAR DATOS DE PRUEBA
-- Los ID SERIAL se generan automáticamente
-- ==========================================


-- 1. TABLA: usuario

INSERT INTO usuario
    (nombre, password, correo_electronico, nombre_de_usuario)
VALUES
    ('Ana Pérez', 'pass123', 'ana@example.com', 'ana_p'),
    ('Carlos Gómez', 'pass456', 'carlos@example.com', 'carlos_g'),
    ('Sofía Ruiz', 'pass789', 'sofia@example.com', 'sofia_r');


-- 2. TABLA: grupo

INSERT INTO grupo (nombre, descripcion)
VALUES
    ('Equipo Frontend', 'Desarrolladores de la interfaz de usuario'),
    ('Equipo Backend', 'Desarrolladores de servicios y base de datos'),
    ('Equipo QA', 'Control de calidad y pruebas de software');


-- 3. TABLA: proyecto

INSERT INTO proyecto
    (nombre, creador, fecha_creacion, duracion)
VALUES
    ('ScrumBird Web', 1, '2026-01-10', '3 meses'),
    ('App Móvil ScrumBird', 2, '2026-02-15', '4 meses'),
    ('Portal de Reportes', 3, '2026-03-01', '2 meses');


-- 4. TABLA: trabajando_en_proyecto

INSERT INTO trabajando_en_proyecto
    (id_usuario, id_proyecto, rol)
VALUES
    (1, 1, 'Product Owner'),
    (2, 2, 'Scrum Master'),
    (3, 3, 'Developer');


-- 5. TABLA: mensaje

INSERT INTO mensaje
    (id_autor, id_usuario_destino, fecha, mensaje)
VALUES
    (1, 2, '2026-10-18 09:00:00',
     'Hola Carlos, ¿cómo va el avance del sprint?'),
    (2, 1, '2026-10-18 09:05:00',
     'Hola Ana, todo en orden por aquí.'),
    (3, 1, '2026-10-18 10:30:00',
     'Ana, ¿puedes revisar los pendientes?');


-- 6. TABLA: esta_en_grupo

INSERT INTO esta_en_grupo
    (id_usuario, id_grupo, rol)
VALUES
    (1, 1, 'Líder técnico'),
    (2, 2, 'Colaborador'),
    (3, 3, 'Tester principal');


-- 7. TABLA: mensaje_grupo

INSERT INTO mensaje_grupo
    (id_autor, id_grupo_destino, fecha, mensaje)
VALUES
    (1, 1, '2026-10-18 11:00:00',
     'Bienvenidos a la reunión del equipo frontend'),
    (2, 2, '2026-10-18 11:15:00',
     'Actualización de la base de datos completada'),
    (3, 3, '2026-10-18 11:30:00',
     'Casos de prueba subidos al repositorio');


-- 8. TABLA: sprint

INSERT INTO sprint
    (no_iteracion, objetivo, fecha_inicio, fecha_fin, id_proyecto)
VALUES
    (1, 'Configuración inicial y login',
     '2026-01-10', '2026-01-24', 1),
    (1, 'Estructura base de la app móvil',
     '2026-02-15', '2026-03-01', 2),
    (1, 'Diseño de base de datos de reportes',
     '2026-03-01', '2026-03-15', 3);


-- 9. TABLA: historia_de_usuario

INSERT INTO historia_de_usuario
    (nombre, descripcion, criterios_de_aceptacion, valor,
     puntos_de_historia, factor_de_complejidad, coste_estimado,
     id_proyecto, asignado_al_sprint)
VALUES
    ('Autenticación', 'Permitir iniciar sesión',
     'Validar credenciales correctamente',
     10, 5, 1.5, 3, 1, 1),
    ('Splash Screen', 'Mostrar pantalla de carga',
     'Duración de 2 segundos sin bloqueos',
     5, 3, 1.0, 2, 2, 2),
    ('Exportar PDF', 'Exportar datos a formato PDF',
     'Descarga correcta del archivo',
     8, 8, 2.0, 5, 3, 3);


-- 10. TABLA: comentario

INSERT INTO comentario
    (emisor, id_historia, fecha_ultima_modificacion,
     contenido, id_proyecto)
VALUES
    (1, 1, '2026-10-18',
     'Excelente avance en el login', 1),
    (2, 2, '2026-10-18',
     'Falta afinar la resolución de la imagen', 2),
    (3, 3, '2026-10-18',
     'Revisar la paginación del reporte', 3);


-- 11. TABLA: trabajando_en_historia

INSERT INTO trabajando_en_historia
    (responsable, historia_asignada, estado,
     evidencias_desarrollo, id_proyecto)
VALUES
    (1, 1, 'En proceso', 'commit_hash_123', 1),
    (2, 2, 'Completado', 'commit_hash_456', 2),
    (3, 3, 'Pendiente', 'sin evidencias', 3);


-- ==========================================
-- CONSULTAR LAS TABLAS
-- ==========================================

SELECT * FROM scrumbird.usuario;
SELECT * FROM scrumbird.grupo;
SELECT * FROM scrumbird.proyecto;
SELECT * FROM scrumbird.trabajando_en_proyecto;
SELECT * FROM scrumbird.mensaje;
SELECT * FROM scrumbird.esta_en_grupo;
SELECT * FROM scrumbird.mensaje_grupo;
SELECT * FROM scrumbird.sprint;
SELECT * FROM scrumbird.historia_de_usuario;
SELECT * FROM scrumbird.comentario;
SELECT * FROM scrumbird.trabajando_en_historia;



--------------------------------------
Primera version----------------------
CREATE SCHEMA scrumbird;
SET search_path TO scrumbird, public;

CREATE TABLE usuario (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255),
    nombre_de_usuario VARCHAR(255) NOT NULL
);

CREATE TABLE proyecto (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    creador INT,
    fecha_creacion DATE,
    duracion VARCHAR(100),
    FOREIGN KEY (creador) REFERENCES usuario(id)
);

CREATE TABLE trabajando_en_proyecto (
    id_usuario INT,
    id_proyecto INT,
    rol VARCHAR(100),
    PRIMARY KEY (id_usuario, id_proyecto),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE
);

CREATE TABLE mensaje (
    id INT PRIMARY KEY,
    id_autor INT,
    id_usuario_destino INT,
    fecha TIMESTAMP NOT NULL, -- Fecha y hora exacta
    mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_autor) REFERENCES usuario(id),
    FOREIGN KEY (id_usuario_destino) REFERENCES usuario(id)
);

CREATE TABLE grupo (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE esta_en_grupo (
    id_usuario INT,
    id_grupo INT,
    rol VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_usuario, id_grupo),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    FOREIGN KEY (id_grupo) REFERENCES grupo(id)    
);

CREATE TABLE mensaje_grupo (
    id INT PRIMARY KEY,
    id_autor INT,
    id_grupo_destino INT,
    fecha TIMESTAMP NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_autor) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo_destino) REFERENCES grupo(id) ON DELETE CASCADE
);

CREATE TABLE sprint (
    id INT PRIMARY KEY,
    no_iteracion INT NOT NULL,
    objetivo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_proyecto INT NOT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE
);

CREATE TABLE historia_de_usuario (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    criterios_de_aceptacion VARCHAR(255) NOT NULL,
    valor INT NOT NULL,
    puntos_de_historia INT,
    factor_de_complejidad DOUBLE PRECISION,
    coste_estimado INT,
    id_proyecto INT,
    asignado_al_sprint INT,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_al_sprint) REFERENCES sprint(id) ON DELETE SET NULL
);

CREATE TABLE comentario (
    id INT PRIMARY KEY,
    emisor INT NOT NULL,
    id_historia INT NOT NULL,
    fecha_ultima_modificacion DATE NOT NULL,
    contenido VARCHAR(255) NOT NULL,
    id_proyecto INT,
    FOREIGN KEY (emisor) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_historia) REFERENCES historia_de_usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE
);

CREATE TABLE trabajando_en_historia (
    id INT PRIMARY KEY,
    responsable INT NOT NULL,
    historia_asignada INT NOT NULL,
    estado VARCHAR(100) NOT NULL,
    evidencias_desarrollo VARCHAR(255),
    id_proyecto INT NOT NULL,
    FOREIGN KEY (responsable) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (historia_asignada) REFERENCES historia_de_usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE
);

-- ==========================================
-- 1. TABLA: usuario
-- ==========================================
INSERT INTO usuario (id, nombre, password, correo_electronico, nombre_de_usuario) VALUES
(1, 'Ana Pérez', 'pass123', 'ana@example.com', 'ana_p'),
(2, 'Carlos Gómez', 'pass456', 'carlos@example.com', 'carlos_g'),
(3, 'Sofía Ruiz', 'pass789', 'sofia@example.com', 'sofia_r');

-- ==========================================
-- 2. TABLA: grupo
-- ==========================================
INSERT INTO grupo (id, nombre, descripcion) VALUES
(1, 'Equipo Frontend', 'Desarrolladores de la interfaz de usuario'),
(2, 'Equipo Backend', 'Desarrolladores de servicios y base de datos'),
(3, 'Equipo QA', 'Control de calidad y pruebas de software');

-- ==========================================
-- 3. TABLA: proyecto
-- ==========================================
INSERT INTO proyecto (id, nombre, creador, fecha_creacion, duracion) VALUES
(1, 'ScrumBird Web', 1, '2026-01-10', '3 meses'),
(2, 'App Móvil ScrumBird', 2, '2026-02-15', '4 meses'),
(3, 'Portal de Reportes', 3, '2026-03-01', '2 meses');

-- ==========================================
-- 4. TABLA: trabajando_en_proyecto
-- ==========================================
INSERT INTO trabajando_en_proyecto (id_usuario, id_proyecto, rol) VALUES
(1, 1, 'Product Owner'),
(2, 2, 'Scrum Master'),
(3, 3, 'Developer');

-- ==========================================
-- 5. TABLA: mensaje
-- ==========================================
INSERT INTO mensaje (id, id_autor, id_usuario_destino, fecha, mensaje) VALUES
(1, 1, 2, '2026-10-18 09:00:00', 'Hola Carlos, ¿cómo va el avance del sprint?'),
(2, 2, 1, '2026-10-18 09:05:00', 'Hola Ana, todo en orden por aquí.'),
(3, 3, 1, '2026-10-18 10:30:00', 'Ana, ¿puedes revisar los pendientes?');

-- ==========================================
-- 6. TABLA: esta_en_grupo
-- ==========================================
INSERT INTO esta_en_grupo (id_usuario, id_grupo, rol) VALUES
(1, 1, 'Líder técnico'),
(2, 2, 'Colaborador'),
(3, 3, 'Tester principal');

-- ==========================================
-- 7. TABLA: mensaje_grupo
-- ==========================================
INSERT INTO mensaje_grupo (id, id_autor, id_grupo_destino, fecha, mensaje) VALUES
(1, 1, 1, '2026-10-18 11:00:00', 'Bienvenidos a la reunión del equipo frontend'),
(2, 2, 2, '2026-10-18 11:15:00', 'Actualización de la base de datos completada'),
(3, 3, 3, '2026-10-18 11:30:00', 'Casos de prueba subidos al repositorio');

-- ==========================================
-- 8. TABLA: sprint
-- ==========================================
INSERT INTO sprint (id, no_iteracion, objetivo, fecha_inicio, fecha_fin, id_proyecto) VALUES
(1, 1, 'Configuración inicial y login', '2026-01-10', '2026-01-24', 1),
(2, 1, 'Estructura base de la app móvil', '2026-02-15', '2026-03-01', 2),
(3, 1, 'Diseño de base de datos de reportes', '2026-03-01', '2026-03-15', 3);

-- ==========================================
-- 9. TABLA: historia_de_usuario
-- ==========================================
INSERT INTO historia_de_usuario (id, nombre, descripcion, criterios_de_aceptacion, valor, puntos_de_historia, factor_de_complejidad, coste_estimado, id_proyecto, asignado_al_sprint) VALUES
(1, 'Autenticación', 'Permitir iniciar sesión', 'Validar credenciales correctamente', 10, 5, 1.5, 3, 1, 1),
(2, 'Splash Screen', 'Mostrar pantalla de carga', 'Duración de 2 segundos sin bloqueos', 5, 3, 1.0, 2, 2, 2),
(3, 'Exportar PDF', 'Exportar datos a formato PDF', 'Descarga correcta del archivo', 8, 8, 2.0, 5, 3, 3);

-- ==========================================
-- 10. TABLA: comentario
-- ==========================================
INSERT INTO comentario (id, emisor, id_historia, fecha_ultima_modificacion, contenido, id_proyecto) VALUES
(1, 1, 1, '2026-10-18', 'Excelente avance en el login', 1),
(2, 2, 2, '2026-10-18', 'Falta afinar la resolución de la imagen', 2),
(3, 3, 3, '2026-10-18', 'Revisar la paginación del reporte', 3);

-- ==========================================
-- 11. TABLA: trabajando_en_historia
-- ==========================================
INSERT INTO trabajando_en_historia (id, responsable, historia_asignada, estado, evidencias_desarrollo, id_proyecto) VALUES
(1, 1, 1, 'En proceso', 'commit_hash_123', 1),
(2, 2, 2, 'Completado', 'commit_hash_456', 2),
(3, 3, 3, 'Pendiente', 'sin evidencias', 3);

SELECT * FROM scrumbird.usuario;
SELECT * FROM scrumbird.grupo;
SELECT * FROM scrumbird.trabajando_en_proyecto;
SELECT * FROM scrumbird.mensaje;
SELECT * FROM scrumbird.esta_en_grupo;
SELECT * FROM scrumbird.mensaje_grupo;
SELECT * FROM scrumbird.sprint;
SELECT * FROM scrumbird.historia_de_usuario;
SELECT * FROM scrumbird.comentario;
SELECT * FROM scrumbird.trabajando_en_historia;
