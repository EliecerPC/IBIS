CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
);

CREATE TABLE equipo (
    id_equipo SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(100),
    serial VARCHAR(100) UNIQUE,
    estado VARCHAR(30) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    observaciones TEXT
);


CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria SERIAL PRIMARY KEY,

    id_usuario INTEGER
        REFERENCES usuario(id_usuario)
        ON DELETE SET NULL,

    id_equipo INTEGER
        REFERENCES equipo(id_equipo)
        ON DELETE SET NULL,

    accion VARCHAR(20) NOT NULL
        CHECK (accion IN ('INSERTAR', 'EDITAR', 'ELIMINAR')),

    fecha_hora TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    detalles JSONB NOT NULL DEFAULT '{}'::jsonb
);
