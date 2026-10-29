# Proyecto-SCRUM
Proyecto para la matería Gestión de Procesos de Desarrollo de Software (GPDS)

-- ========================================== -- ELIMINAR Y CREAR ESQUEMA -- ==========================================

DROP SCHEMA IF EXISTS scrumbird CASCADE;

CREATE SCHEMA scrumbird;

SET search_path TO scrumbird, public;

-- ========================================== -- 1. TABLA: usuario -- ==========================================

CREATE TABLE usuario ( id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, correo_electronico VARCHAR(255), nombre_de_usuario VARCHAR(255) NOT NULL );

-- ========================================== -- 2. TABLA: proyecto -- ==========================================

CREATE TABLE proyecto ( id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, creador INT, fecha_creacion DATE, duracion VARCHAR(100), FOREIGN KEY (creador) REFERENCES usuario(id) );

-- ========================================== -- 3. TABLA: trabajando_en_proyecto -- Llave primaria compuesta: NO modificar -- ==========================================

CREATE TABLE trabajando_en_proyecto ( id_usuario INT, id_proyecto INT, rol VARCHAR(100), PRIMARY KEY (id_usuario, id_proyecto), FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE, FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE );

-- ========================================== -- 4. TABLA: mensaje -- ==========================================

CREATE TABLE mensaje ( id SERIAL PRIMARY KEY, id_autor INT, id_usuario_destino INT, fecha TIMESTAMP NOT NULL, mensaje VARCHAR(255) NOT NULL, FOREIGN KEY (id_autor) REFERENCES usuario(id), FOREIGN KEY (id_usuario_destino) REFERENCES usuario(id) );

-- ========================================== -- 5. TABLA: grupo -- ==========================================

CREATE TABLE grupo ( id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, descripcion VARCHAR(255) );

-- ========================================== -- 6. TABLA: esta_en_grupo -- Llave primaria compuesta: NO modificar -- ==========================================

CREATE TABLE esta_en_grupo ( id_usuario INT, id_grupo INT, rol VARCHAR(255) NOT NULL, PRIMARY KEY (id_usuario, id_grupo), FOREIGN KEY (id_usuario) REFERENCES usuario(id), FOREIGN KEY (id_grupo) REFERENCES grupo(id) );

-- ========================================== -- 7. TABLA: mensaje_grupo -- ==========================================

CREATE TABLE mensaje_grupo ( id SERIAL PRIMARY KEY, id_autor INT, id_grupo_destino INT, fecha TIMESTAMP NOT NULL, mensaje VARCHAR(255) NOT NULL, FOREIGN KEY (id_autor) REFERENCES usuario(id) ON DELETE CASCADE, FOREIGN KEY (id_grupo_destino) REFERENCES grupo(id) ON DELETE CASCADE );

-- ========================================== -- 8. TABLA: sprint -- ==========================================

CREATE TABLE sprint ( id SERIAL PRIMARY KEY, no_iteracion INT NOT NULL, objetivo VARCHAR(255), fecha_inicio DATE, fecha_fin DATE, id_proyecto INT NOT NULL, FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE );

-- ========================================== -- 9. TABLA: historia_de_usuario -- ==========================================

CREATE TABLE historia_de_usuario ( id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL, descripcion VARCHAR(255) NOT NULL, valor INT NOT NULL, prioridad BOOLEAN NOT NULL DEFAULT FALSE, puntos_de_historia INT, factor_de_complejidad DOUBLE PRECISION, coste_estimado INT, id_proyecto INT, asignado_al_sprint INT, FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE, FOREIGN KEY (asignado_al_sprint) REFERENCES sprint(id) ON DELETE SET NULL );

-- ========================================== -- 10. TABLA: criterios_de_aceptacion -- ==========================================
CREATE TABLE criterios_de_aceptacion (id SERIAL PRIMARY KEY, criterios_de_aceptacion VARCHAR(255) NOT NULL, id_historia INT NOT NULL, id_proyecto INT NOT NULL, FOREIGN KEY (id_historia) REFERENCES historia_de_usuario(id) ON DELETE CASCADE, FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE);


-- ========================================== -- 11. TABLA: comentario -- ==========================================

CREATE TABLE comentario ( id SERIAL PRIMARY KEY, emisor INT NOT NULL, id_historia INT NOT NULL, fecha_ultima_modificacion DATE NOT NULL, contenido VARCHAR(255) NOT NULL, id_proyecto INT, FOREIGN KEY (emisor) REFERENCES usuario(id) ON DELETE CASCADE, FOREIGN KEY (id_historia) REFERENCES historia_de_usuario(id) ON DELETE CASCADE, FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE );

-- ========================================== -- 12. TABLA: trabajando_en_historia -- ==========================================

CREATE TABLE scrumbird.trabajando_en_historia ( id SERIAL PRIMARY KEY, responsable INT NOT NULL, historia_asignada INT NOT NULL,

estado VARCHAR(100) NOT NULL DEFAULT 'por-empezar'
    CHECK (estado IN (
        'por-empezar',
        'en-progreso',
        'en-revision',
        'terminado'
    )),

evidencias_desarrollo VARCHAR(255),
id_proyecto INT NOT NULL,

FOREIGN KEY (responsable)
    REFERENCES scrumbird.usuario(id)
    ON DELETE CASCADE,

FOREIGN KEY (historia_asignada)
    REFERENCES scrumbird.historia_de_usuario(id)
    ON DELETE CASCADE,

FOREIGN KEY (id_proyecto)
    REFERENCES scrumbird.proyecto(id)
    ON DELETE CASCADE
);

-- ========================================== -- 12. TABLA: tipo_reunion -- ========================================== --
DROP TABLE tipo_reunion;
CREATE TABLE tipo_reunion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    duracion_estimada VARCHAR(100),
    participantes_requeridos VARCHAR(255)
);
ALTER SEQUENCE scrumbird.tipo_reunion_id_seq RESTART WITH 1;
-- ========================================== -- 13. TABLA: reunion -- ========================================== --
DROP TABLE reunion;
CREATE TABLE reunion (
    id SERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_sprint INT,
    id_tipo_reunion INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(100),
    FOREIGN KEY (id_proyecto) REFERENCES proyecto(id) ON DELETE CASCADE,
    FOREIGN KEY (id_sprint) REFERENCES sprint(id) ON DELETE SET NULL,
    FOREIGN KEY (id_tipo_reunion) REFERENCES tipo_reunion(id) ON DELETE CASCADE
);

-- ========================================== -- 14. TABLA: reunion_participante (Llave primaria compuesta) -- ========================================== --
DROP TABLE reunion_participante;
CREATE TABLE reunion_participante (
    id_reunion INT,
    id_usuario INT,
    anotaciones VARCHAR(255),
    PRIMARY KEY (id_reunion, id_usuario),
    FOREIGN KEY (id_reunion) REFERENCES reunion(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- ========================================== -- 15. TABLA: resumen_reunion -- ========================================== --
DROP TABLE resumen_reunion;
CREATE TABLE resumen_reunion (
    id_reunion INT PRIMARY KEY,
    requisitos_seleccionados TEXT,
    dudas_comentadas TEXT,
    FOREIGN KEY (id_reunion) REFERENCES reunion(id) ON DELETE CASCADE
);

-- ========================================== -- INSERTAR DATOS DE PRUEBA -- Los ID SERIAL se generan automáticamente -- ==========================================

-- 1. TABLA: usuario

INSERT INTO usuario (nombre, password, correo_electronico, nombre_de_usuario) VALUES ('Ana Pérez', 'pass123', 'ana@example.com', 'ana_p'), ('Carlos Gómez', 'pass456', 'carlos@example.com', 'carlos_g'), ('Sofía Ruiz', 'pass789', 'sofia@example.com', 'sofia_r');

-- 2. TABLA: grupo

INSERT INTO grupo (nombre, descripcion) VALUES ('Equipo Frontend', 'Desarrolladores de la interfaz de usuario'), ('Equipo Backend', 'Desarrolladores de servicios y base de datos'), ('Equipo QA', 'Control de calidad y pruebas de software');

-- 3. TABLA: proyecto

INSERT INTO proyecto (nombre, creador, fecha_creacion, duracion) VALUES ('ScrumBird Web', 1, '2026-01-10', '3 meses'), ('App Móvil ScrumBird', 2, '2026-02-15', '4 meses'), ('Portal de Reportes', 3, '2026-03-01', '2 meses');

-- 4. TABLA: trabajando_en_proyecto

INSERT INTO trabajando_en_proyecto (id_usuario, id_proyecto, rol) VALUES (1, 1, 'Product Owner'), (2, 2, 'Scrum Master'), (3, 3, 'Developer');

-- 5. TABLA: mensaje

INSERT INTO mensaje (id_autor, id_usuario_destino, fecha, mensaje) VALUES (1, 2, '2026-10-18 09:00:00', 'Hola Carlos, ¿cómo va el avance del sprint?'), (2, 1, '2026-10-18 09:05:00', 'Hola Ana, todo en orden por aquí.'), (3, 1, '2026-10-18 10:30:00', 'Ana, ¿puedes revisar los pendientes?');

-- 6. TABLA: esta_en_grupo

INSERT INTO esta_en_grupo (id_usuario, id_grupo, rol) VALUES (1, 1, 'Líder técnico'), (2, 2, 'Colaborador'), (3, 3, 'Tester principal');

-- 7. TABLA: mensaje_grupo

INSERT INTO mensaje_grupo (id_autor, id_grupo_destino, fecha, mensaje) VALUES (1, 1, '2026-10-18 11:00:00', 'Bienvenidos a la reunión del equipo frontend'), (2, 2, '2026-10-18 11:15:00', 'Actualización de la base de datos completada'), (3, 3, '2026-10-18 11:30:00', 'Casos de prueba subidos al repositorio');

-- 8. TABLA: sprint

INSERT INTO sprint (no_iteracion, objetivo, fecha_inicio, fecha_fin, id_proyecto) VALUES (1, 'Configuración inicial y login', '2026-01-10', '2026-01-24', 1), (1, 'Estructura base de la app móvil', '2026-02-15', '2026-03-01', 2), (1, 'Diseño de base de datos de reportes', '2026-03-01', '2026-03-15', 3);
INSERT INTO sprint (no_iteracion, objetivo, fecha_inicio, fecha_fin, id_proyecto) VALUES (2, NULL, NULL, NULL, 1),(3, NULL, NULL, NULL, 2),(4, NULL, NULL, NULL, 3);

-- 9. TABLA: historia_de_usuario

INSERT INTO historia_de_usuario (nombre, descripcion, valor, prioridad,  puntos_de_historia, factor_de_complejidad, coste_estimado, id_proyecto, asignado_al_sprint) VALUES ('Autenticación', 'Permitir iniciar sesión', 10, TRUE, 5, 1.5, 3, 1, 1), ('Splash Screen', 'Mostrar pantalla de carga', 5, FALSE,  3, 1.0, 2, 2, 2), ('Exportar PDF', 'Exportar datos a formato PDF', 8, TRUE, 8, 2.0, 5, 3, 3);

-- 10. TABLA: criterios_de_aceptacion (Inserts correspondientes)

INSERT INTO criterios_de_aceptacion (criterios_de_aceptacion, id_historia, id_proyecto) VALUES
-- HISTORIA 1 (id_historia = 1, id_proyecto = 1): Autenticación
('Como usuario registrado, cuando introduzca un correo y contraseña válidos, entonces el sistema me permitirá acceder al dashboard principal.', 1, 1),
('Como usuario, cuando introduzca una contraseña incorrecta, entonces el sistema mostrará un mensaje de error y bloqueará temporalmente el intento tras 3 fallos.', 1, 1),
('Como usuario, cuando haga clic en "Recordar contraseña", entonces el sistema enviará un enlace de recuperación a mi correo electrónico registrado.', 1, 1),
-- HISTORIA 2 (id_historia = 2, id_proyecto = 2): Splash Screen
('Como usuario de la app móvil, cuando abra la aplicación, entonces se mostrará la pantalla de carga (Splash Screen) con el logotipo oficial de ScrumBird.', 2, 2),
('Como usuario, cuando la aplicación esté cargando los datos iniciales en segundo plano, entonces la pantalla de carga se mantendrá visible exactamente durante 2 segundos sin bloqueos.', 2, 2),
('Como usuario, cuando finalice el tiempo de carga, entonces la aplicación transicionará de manera fluida hacia la pantalla de inicio de sesión.', 2, 2),
-- HISTORIA 3 (id_historia = 3, id_proyecto = 3): Exportar PDF
('Como gestor del proyecto, cuando haga clic en el botón "Exportar a PDF" en el módulo de reportes, entonces el sistema generará un archivo con todas las métricas actuales.', 3, 3),
('Como usuario, cuando el documento PDF termine de procesarse, entonces se iniciará automáticamente la descarga del archivo en mi dispositivo local.', 3, 3),
('Como usuario, cuando abra el reporte exportado en PDF, entonces verificaré que la estructura visual y los gráficos se muestren legibles y sin cortes de texto.', 3, 3);



-- 10. TABLA: comentario

INSERT INTO comentario (emisor, id_historia, fecha_ultima_modificacion, contenido, id_proyecto) VALUES (1, 1, '2026-10-18', 'Excelente avance en el login', 1), (2, 2, '2026-10-18', 'Falta afinar la resolución de la imagen', 2), (3, 3, '2026-10-18', 'Revisar la paginación del reporte', 3);

-- 11. TABLA: trabajando_en_historia

INSERT INTO trabajando_en_historia (responsable, historia_asignada, estado, evidencias_desarrollo, id_proyecto) VALUES (1, 1, 'En proceso', 'commit_hash_123', 1), (2, 2, 'Completado', 'commit_hash_456', 2), (3, 3, 'Pendiente', 'sin evidencias', 3);

-- 12. TABLA: tipo_reunion (3 registros)
INSERT INTO tipo_reunion (nombre, duracion_estimada, participantes_requeridos) VALUES ('Daily meeting', '15 minutos', 'Equipo de desarrollo'),('Sprint Planning', '2 horas', 'Product Owner, Scrum Master y Equipo'),('Sprint Retrospective', '1 hora', 'Equipo completo y Scrum Master');

-- 13. TABLA: reunion (3 registros)
INSERT INTO reunion (id_proyecto, id_sprint, id_tipo_reunion, nombre, fecha_inicio, fecha_fin, estado) VALUES (1, 1, 1, 'Daily del Sprint 1', '2026-01-11', '2026-01-11', 'Finalizada'),(1, 1, 2, 'Planificación del Sprint 2', '2026-01-24', '2026-01-24', 'Programada'),(2, 2, 1, 'Retrospectiva', '2026-02-16', '2026-02-16', 'En curso');


-- 14. TABLA: reunion_participante (3 registros)
INSERT INTO reunion_participante (id_reunion, id_usuario, anotaciones) VALUES (1, 1, 'Sin bloqueos reportados'), (1, 2, 'Avanzando con el login'), (2, 3, 'Participando en la asignación de puntos de historia');


-- 15. TABLA: resumen_reunion (3 registros)
INSERT INTO resumen_reunion (id_reunion, requisitos_seleccionados, dudas_comentadas) VALUES (1, '1. Autenticación de usuarios\n' ||'2. Recuperación de contraseña por correo\n' ||'3. Pantalla de carga (Splash Screen)\n' ||'4. Módulo de perfiles y roles\n' ||'5. Dashboard principal con métricas\n' ||'6. Creación y edición de sprints\n' ||'7. Asignación de historias de usuario\n' ||'8. Sistema de comentarios en tiempo real\n' ||'9. Carga de evidencias de desarrollo\n' ||'10. Exportación de reportes en PDF', 'P1: ¿Se requiere soporte offline para la primera versión?\n' ||'R1: No, se validará únicamente con conexión activa a internet.\n' ||'P2: ¿Qué librería utilizaremos para generar los PDF?\n' ||'R2: Se evaluará entre iText y PDFBox por compatibilidad con el servidor.\n' ||'P3: ¿El login debe soportar autenticación por redes sociales?\n' ||'R3: Queda pospuesto para la fase 2 del proyecto.\n' ||'P4: ¿Cuál es el límite de peso para las evidencias de desarrollo?\n' ||'R4: Máximo 10 MB por archivo subido.\n' ||'P5: ¿Se implementará notificaciones push en este sprint?\n' ||'R5: Sí, mediante Firebase Cloud Messaging.\n' ||'P6: ¿Quién tendrá permisos para cerrar un sprint?\n' ||'R6: Únicamente el rol de Scrum Master y Product Owner.\n' ||'P7: ¿Los puntos de historia se basan en horas o complejidad?\n' ||'R7: Se utiliza escala de Fibonacci basada en esfuerzo y complejidad.\n' ||'P8: ¿Se requiere paginación en el listado de reportes?\n' ||'R8: Sí, de 20 elementos por página por defecto.\n' ||'P9: ¿Las contraseñas requieren algún nivel de seguridad estricto?\n' ||'R9: Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.\n' ||'P10: ¿Se realizarán pruebas unitarias obligatorias?\n' ||'R10: Sí, se exige una cobertura mínima del 70% en el backend.');

-- ========================================== -- CONSULTAR LAS TABLAS -- ==========================================

SELECT * FROM scrumbird.usuario; SELECT * FROM scrumbird.grupo; SELECT * FROM scrumbird.proyecto; SELECT * FROM scrumbird.trabajando_en_proyecto; SELECT * FROM scrumbird.mensaje; SELECT * FROM scrumbird.esta_en_grupo; SELECT * FROM scrumbird.mensaje_grupo; SELECT * FROM scrumbird.sprint; SELECT * FROM scrumbird.historia_de_usuario; SELECT * FROM scrumbird.comentario; SELECT * FROM scrumbird.trabajando_en_historia; SELECT * FROM scrumbird.tipo_reunion; SELECT * FROM scrumbird.reunion; SELECT * FROM scrumbird.reunion_participante; SELECT * FROM scrumbird.resumen_reunion;

-- ========================================== --
-- PROCEDIMIENTOS ALMACENADOS
-- ========================================== --

-- Obtiene el detalle completo de todas las historias de usuario asociadas 
-- a un proyecto y sprint específicos. 
-- Diseñada para el rol de facilitador, 
-- incluye el estado actual, datos de esfuerzo, horas estimadas, 
-- responsable, criterios de aceptación, 
-- enlaces a evidencias en el servidor y un listado consolidado de comentarios
DROP FUNCTION If EXISTS scrumbird.sp_obtener_todas_historias_detalle;
CREATE OR REPLACE FUNCTION scrumbird.sp_obtener_todas_historias_detalle( p_id_proyecto INT, p_id_sprint INT ) 
RETURNS TABLE ( 
    historia_id INT, 
    titulo VARCHAR(255), 
    estado_actual VARCHAR(100), 
    no_historia INT, 
    no_sprint INT, 
    puntos_de_esfuerzo INT, 
    horas_estimadas INT, 
    prioridad BOOLEAN,
    nombre_responsable VARCHAR(255), 
    descripcion VARCHAR(255), 
    criterios_de_aceptacion VARCHAR(255), 
    evidencias_servidor VARCHAR(255), 
    comentarios TEXT 
) 
AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        h.id AS historia_id, 
        h.nombre AS titulo, 
        COALESCE(t.estado, 'Sin asignar') AS estado_actual, 
        h.id AS no_historia, 
        COALESCE(s.no_iteracion, 0) AS no_sprint, 
        h.puntos_de_historia AS puntos_de_esfuerzo, 
        h.coste_estimado AS horas_estimadas, 
        h.prioridad,
        COALESCE(u.nombre, 'Sin asignar') AS nombre_responsable, 
        h.descripcion, 
        h.criterios_de_aceptacion, 
        COALESCE(t.evidencias_desarrollo, 'Sin evidencias') AS evidencias_servidor, 
        COALESCE( (SELECT STRING_AGG(c.contenido || ' (Por: ' || us_com.nombre || ' el ' || c.fecha_ultima_modificacion, ' | ') 
        FROM scrumbird.comentario c 
        JOIN scrumbird.usuario us_com 
        ON c.emisor = us_com.id 
        WHERE c.id_historia = h.id), 'Sin comentarios' ) AS comentarios 
    FROM scrumbird.historia_de_usuario h 
    LEFT JOIN scrumbird.sprint s 
    ON h.asignado_al_sprint = s.id 
    LEFT JOIN scrumbird.trabajando_en_historia t 
    ON h.id = t.historia_asignada 
    LEFT JOIN scrumbird.usuario u 
    ON t.responsable = u.id 
    WHERE h.id_proyecto = p_id_proyecto 
    AND (h.asignado_al_sprint = p_id_sprint OR p_id_sprint IS NULL); 
END; 
$$ LANGUAGE plpgsql;

DROP FUNCTION If EXISTS scrumbird.sp_obtener_historias_por_desarrollador;
-- Obtiene el detalle completo únicamente de las historias de usuario 
-- asignadas a un desarrollador en específico, 
-- filtradas por proyecto y sprint. 
-- Está orientada al tablero personal del colaborador, 
-- mostrando su estado actual, estimaciones, evidencias en el servidor 
-- y comentarios correspondientes. 
CREATE OR REPLACE FUNCTION scrumbird.sp_obtener_historias_por_desarrollador( p_id_proyecto INT, p_id_sprint INT, p_id_desarrollador INT ) 
RETURNS TABLE ( 
    historia_id INT, 
    titulo VARCHAR(255), 
    estado_actual VARCHAR(100), 
    no_historia INT, 
    no_sprint INT, 
    puntos_de_esfuerzo INT, 
    horas_estimadas INT, 
    prioridad BOOLEAN,
    nombre_responsable VARCHAR(255), 
    descripcion VARCHAR(255), 
    criterios_de_aceptacion VARCHAR(255), 
    evidencias_servidor VARCHAR(255), 
    comentarios TEXT 
) 
AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        h.id AS historia_id, 
        h.nombre AS titulo, 
        COALESCE(t.estado, 'Sin asignar') AS estado_actual, 
        h.id AS no_historia, 
        COALESCE(s.no_iteracion, 0) AS no_sprint, 
        h.puntos_de_historia AS puntos_de_esfuerzo, 
        h.coste_estimado AS horas_estimadas, 
        h.prioridad,
        COALESCE(u.nombre, 'Sin asignar') AS nombre_responsable, 
        h.descripcion, 
        h.criterios_de_aceptacion, 
        COALESCE(t.evidencias_desarrollo, 'Sin evidencias') AS evidencias_servidor, 
        COALESCE( (SELECT STRING_AGG(c.contenido || ' (Por: ' || us_com.nombre || ' el ' || c.fecha_ultima_modificacion, ' | ') 
        FROM scrumbird.comentario c 
        JOIN scrumbird.usuario us_com 
        ON c.emisor = us_com.id 
        WHERE c.id_historia = h.id), 'Sin comentarios' ) AS comentarios 
    FROM scrumbird.historia_de_usuario h 
    LEFT JOIN scrumbird.sprint s ON h.asignado_al_sprint = s.id 
    JOIN scrumbird.trabajando_en_historia t ON h.id = t.historia_asignada 
    JOIN scrumbird.usuario u ON t.responsable = u.id 
    WHERE h.id_proyecto = p_id_proyecto 
    AND t.responsable = p_id_desarrollador 
    AND (h.asignado_al_sprint = p_id_sprint OR p_id_sprint IS NULL); 
END; 
$$ LANGUAGE plpgsql;


-- Actualiza el estado de la historia en la tabla trabajando_en_historia 
CREATE OR REPLACE PROCEDURE scrumbird.sp_actualizar_estado_historia( p_id_historia INT, p_id_proyecto INT, p_nuevo_estado VARCHAR(100) ) 
LANGUAGE plpgsql AS $$ 
BEGIN
    -- filtrando por la historia y el proyecto correspondientes
    UPDATE scrumbird.trabajando_en_historia
    SET estado = p_nuevo_estado
    WHERE historia_asignada = p_id_historia 
      AND id_proyecto = p_id_proyecto;

    -- Opcional: Validar si se afectó algún registro
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró un registro activo para la historia con ID % en el proyecto %', p_id_historia, p_id_proyecto;
    END IF;
END; 
$$;


-- Modifica el campo de evidencias, usando una ruta calculada
-- Basada en el el id proyecto y sprint
CREATE OR REPLACE FUNCTION scrumbird.fn_asignar_ruta_evidencias()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si no se proporcionó una ruta de evidencias al insertar, se genera automáticamente
    IF NEW.evidencias_desarrollo IS NULL OR NEW.evidencias_desarrollo = '' THEN
        NEW.evidencias_desarrollo := '/evidencias/' || NEW.id_proyecto || '/' || NEW.historia_asignada;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Tigger que ejecuta la funcion de insercion automatica en el campo evidencias_desarrollo
CREATE TRIGGER trg_asignar_evidencias_historia
    BEFORE INSERT ON scrumbird.trabajando_en_historia
    FOR EACH ROW
    EXECUTE FUNCTION scrumbird.fn_asignar_ruta_evidencias();



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
