-- ==========================================================
-- BENÍTEZ DESPENSAS - Base de datos de usuarios y compras
-- Importar desde phpMyAdmin (pestaña "Importar") o ejecutar completo.
-- El inventario de productos sigue en data/inventario.json.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS benitez_stock
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE benitez_stock;

-- Usuarios del sistema. "password" guarda el hash BCRYPT (60 caracteres);
-- se deja en VARCHAR(255) para admitir otros algoritmos a futuro.
CREATE TABLE IF NOT EXISTS usuarios (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- Cabecera de cada compra confirmada por un usuario.
CREATE TABLE IF NOT EXISTS compras (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id  INT UNSIGNED NOT NULL,
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    medio_pago  VARCHAR(30) NOT NULL,
    total       DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_compras_usuario (usuario_id),
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Renglones de cada compra (se guardan nombre y precio al momento de comprar).
CREATE TABLE IF NOT EXISTS compra_items (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    compra_id        INT UNSIGNED NOT NULL,
    producto_id      INT UNSIGNED NOT NULL,
    nombre           VARCHAR(150) NOT NULL,
    precio_unitario  DECIMAL(12,2) NOT NULL,
    cantidad         INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_items_compra (compra_id),
    CONSTRAINT fk_items_compra FOREIGN KEY (compra_id)
        REFERENCES compras (id) ON DELETE CASCADE
) ENGINE=InnoDB;
