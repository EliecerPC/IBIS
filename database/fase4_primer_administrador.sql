
-- FASE 4: Creación del primer administrador

-- Se crean los roles del sistema y el primer usuario Administrador.
-- Las contraseñas se almacenan mediante hashes bcrypt.
--
-- 1. Generar el hash desde la carpeta backend:
--    node generar_hash.js admin123
--
-- 2. Reemplazar el hash del INSERT por el generado.
--
-- 3. Ejecutar el script en pgAdmin.
--
-- Los demás usuarios se registran desde la página Usuarios.



-- Crear los roles si aún no existen
INSERT INTO rol (nombre)
SELECT 'Administrador' WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'Administrador');

INSERT INTO rol (nombre)
SELECT 'Coordinacion' WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'Coordinacion');

INSERT INTO rol (nombre)
SELECT 'Area encargada' WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'Area encargada');

INSERT INTO rol (nombre)
SELECT 'Estudiante' WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'Estudiante');

-- Primer usuario Administrador
INSERT INTO usuario (nombre, correo, contrasena, id_rol)
VALUES (
    'Administrador IBIS',
    'admin@ut.edu.co',
    '$$2a$10$6KOyUi0nhg68AWhppa1VMO0Fh3SGnpGhLpWz0.9s1b1gqFZDuQCYK',
    (SELECT id_rol FROM rol WHERE nombre = 'Administrador')
);

-- Actualizar la contraseña de un usuario existente, si es necesario
-- UPDATE usuario
-- SET contrasena = '<<PEGA_AQUI_EL_HASH>>'
-- WHERE correo = 'david.rodriguez@ut.edu.co';