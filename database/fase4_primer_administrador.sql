-- =========================================================
-- FASE 4 - Primer usuario Administrador (bootstrap)
-- =========================================================
-- El login ahora compara contraseñas CIFRADAS (bcrypt), por lo que
-- los usuarios de prueba insertados anteriormente con la contraseña
-- en texto plano ('123456') ya NO podrán iniciar sesión.
--
-- Para poder entrar por primera vez necesitas al menos un usuario
-- Administrador con una contraseña ya cifrada. Los DEMÁS usuarios
-- (Coordinación, Área encargada, Estudiantes) ya NO se insertan por
-- SQL: se crean desde la página "Usuarios" una vez que inicies
-- sesión como Administrador (el backend se encarga de cifrarlos
-- automáticamente).
--
-- PASOS:
-- 1. En la carpeta backend, ejecuta en una terminal:
--       node generar_hash.js admin123
--    (puedes cambiar "admin123" por la contraseña que prefieras)
--
-- 2. Copia el hash que te imprime la terminal y reemplaza
--    <<PEGA_AQUI_EL_HASH>> en el INSERT de abajo.
--
-- 3. Ejecuta este script completo en el Query Tool de pgAdmin.
-- =========================================================

-- Los roles solo se crean si no existen todavía
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
    '$2a$10$aSadHueJcrN/bqv9oxB8kuN6Z3Fn0tkmPuUPn4dH2LsFMYz3Lmkpu',
    (SELECT id_rol FROM rol WHERE nombre = 'Administrador')
);

-- Si ya habías insertado usuarios de prueba con contraseña en texto
-- plano (correo, etc.) y prefieres actualizarlos en vez de borrarlos,
-- puedes usar UPDATE en lugar de INSERT, por ejemplo:
--
-- UPDATE usuario SET contrasena = '<<PEGA_AQUI_EL_HASH>>'
-- WHERE correo = 'david.rodriguez@ut.edu.co';
