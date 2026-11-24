-- Horas totales reales de una historia.
-- NULL significa que todavía no se han registrado.
-- Ejecutar una sola vez por base de datos.
ALTER TABLE scrumbird.historia_de_usuario
ADD COLUMN horas_reales NUMERIC(10,2)
CHECK (horas_reales >= 0);
-- Puntos pendientes del proyecto al cierre de un sprint.
-- NULL significa que todavía no existe una medición.
ALTER TABLE scrumbird.burndown_cierre
ADD COLUMN puntos_restantes INTEGER
CHECK (puntos_restantes >= 0);
ALTER TABLE scrumbird.burndown_diario
ADD COLUMN puntos_restantes INTEGER
CHECK (puntos_restantes >= 0);