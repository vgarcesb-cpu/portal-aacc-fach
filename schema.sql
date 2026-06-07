-- ============================================================
-- SCHEMA.SQL - PORTAL A/C FACH
-- Base de datos Cloudflare D1 (SQLite)
-- Gestión de equipos de Aire Acondicionado FACH
-- Autor: Victor Manuel Garces Borje (totis.cl)
-- ============================================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operador',
  -- Roles: operador, tecnico, supervisor, administrador
  activo INTEGER DEFAULT 1,
  creado_en TEXT DEFAULT (datetime('now')),
  ultimo_acceso TEXT
);

-- Tabla principal de equipos A/C
CREATE TABLE IF NOT EXISTS equipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,           -- MAYOR-1, MENOR-3, etc.
  numero INTEGER NOT NULL,
  categoria TEXT NOT NULL,               -- MAYOR_40000_BTU | MENOR_40000_BTU
  tipo TEXT NOT NULL,                    -- COMPACTA | SPLIT/CIELO | SPLIT/PISO | VENTANA
  hfc TEXT NOT NULL,                     -- R-22 | R-410A | R-407
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  condicion TEXT NOT NULL DEFAULT 'ACTIVO',
  -- ACTIVO | FUERA_DE_SERVICIO | EN_MANTENIMIENTO | POR_BAJA
  fecha_instalacion TEXT,
  capacidad_btu TEXT,
  voltaje TEXT,
  amperaje TEXT,
  potencia_kw TEXT,
  empresa_mantenimiento TEXT,
  observaciones TEXT,
  creado_por INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- Tabla de bitácora de mantenimiento
CREATE TABLE IF NOT EXISTS bitacora_mantenimiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  tecnico TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL,
  -- PREVENTIVO | CORRECTIVO | PREDICTIVO | INSTALACION | REVISION | RECARGA_REFRIGERANTE | LIMPIEZA | OTRO
  descripcion_trabajo TEXT NOT NULL,
  repuestos_utilizados TEXT,
  costo REAL DEFAULT 0,
  proximo_mantenimiento TEXT,
  observaciones TEXT,
  registrado_por INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Tabla de inspecciones técnicas
CREATE TABLE IF NOT EXISTS inspecciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER NOT NULL,
  fecha_inspeccion TEXT NOT NULL,
  tipo_inspeccion TEXT NOT NULL,
  -- VISUAL | FUNCIONAL | PREVENTIVA | CORRECTIVA | ANUAL
  resultado TEXT,
  hallazgos TEXT,
  recomendaciones TEXT,
  condicion_general TEXT,
  -- BUENA | REGULAR | DEFICIENTE | CRITICA
  proxima_inspeccion TEXT,
  inspector TEXT,
  empresa_externa TEXT,
  costo REAL DEFAULT 0,
  registrado_por INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Tabla de alertas y avisos
CREATE TABLE IF NOT EXISTS alertas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id INTEGER,
  tipo TEXT NOT NULL,
  -- MANTENIMIENTO_VENCIDO | PROXIMO_MANTENIMIENTO | INSPECCION | FALLA | STOCK
  mensaje TEXT NOT NULL,
  criticidad TEXT DEFAULT 'media',
  -- alta | media | baja
  estado TEXT DEFAULT 'activa',
  -- activa | resuelta | ignorada
  fecha_alerta TEXT DEFAULT (datetime('now')),
  fecha_resolucion TEXT,
  resuelto_por INTEGER,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  FOREIGN KEY (resuelto_por) REFERENCES usuarios(id)
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  actualizado_en TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Configuración institucional FACH
INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES
  ('institucion_nombre', 'Fuerza Aérea de Chile (FACH)', 'Nombre de la institución'),
  ('institucion_unidad', 'Climatización & Energía', 'Unidad responsable'),
  ('responsable_nombre', 'Victor Manuel Garces Borje', 'Nombre del responsable'),
  ('responsable_cargo', 'Técnico de Mantenimiento', 'Cargo del responsable'),
  ('sitio_web', 'www.totis.cl', 'Sitio web'),
  ('emailjs_service_id', '', 'EmailJS Service ID'),
  ('emailjs_template_id', '', 'EmailJS Template ID'),
  ('emailjs_public_key', '', 'EmailJS Public Key');

-- Usuario administrador por defecto (CAMBIAR CONTRASEÑA EN PRODUCCIÓN)
INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Administrador FACH', 'admin@fach.cl', 'Admin2024!', 'administrador');

-- ============================================================
-- SEED: 29 Equipos FACH (datos reales del inventario)
-- ============================================================

-- MAYORES DE 40.000 BTU (12 equipos)
INSERT OR IGNORE INTO equipos (codigo, numero, categoria, tipo, hfc, marca, modelo, numero_serie, ubicacion, condicion) VALUES
  ('MAYOR-1',  1,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101510863L',           'BIBLIOTECA NORTE EXTERIOR',                 'ACTIVO'),
  ('MAYOR-2',  2,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101810471L',           'COFEE SS. OO',                              'ACTIVO'),
  ('MAYOR-3',  3,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101710838L',           'CDCIA G.I. A',                              'FUERA_DE_SERVICIO'),
  ('MAYOR-4',  4,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101811211L',           'SALA DE CLASE 1',                           'ACTIVO'),
  ('MAYOR-5',  5,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101810479L',           'SALA DE CLASE 2',                           'ACTIVO'),
  ('MAYOR-6',  6,  'MAYOR_40000_BTU', 'COMPACTA',    'R-410A', 'TRANE',      'WSC060EDR0AN',   '101810454L',           'SALA DE CLASE 3 Y 4',                       'ACTIVO'),
  ('MAYOR-7',  7,  'MAYOR_40000_BTU', 'COMPACTA',    'R-407',  'CARRIER',    '50TQN-240-E941', '1611B13692',           'SALA MARTE',                                'FUERA_DE_SERVICIO'),
  ('MAYOR-8',  8,  'MAYOR_40000_BTU', 'COMPACTA',    'R-22',   'YORK',       'B3CH060A50C',    'NMEM150053',           'SALA PARTIDO 1',                            'ACTIVO'),
  ('MAYOR-9',  9,  'MAYOR_40000_BTU', 'COMPACTA',    'R-22',   'YORK',       'B3CH060A50C',    'NMEM150056',           'SALA PARTIDO 2',                            'ACTIVO'),
  ('MAYOR-10', 10, 'MAYOR_40000_BTU', 'SPLIT/CIELO', 'R-22',   'YORK',       'E1CP060A50C',    'MFMM053458',           'INFORMATICA SUBTERRANEO',                   'FUERA_DE_SERVICIO'),
  ('MAYOR-11', 11, 'MAYOR_40000_BTU', 'SPLIT/CIELO', 'R-22',   'YORK',       'E1CP048A50C',    'MGMM094590',           'PABELLON JUPITER',                          'FUERA_DE_SERVICIO'),
  ('MAYOR-12', 12, 'MAYOR_40000_BTU', 'COMPACTA',    'R-22',   'LENNOX',     'CHP15-513-1M',   '5186C27709',           'BIBLIOTECA RECEPCION SECTOR NORTE EXTERIOR','FUERA_DE_SERVICIO');

-- MENORES DE 40.000 BTU (17 equipos)
INSERT OR IGNORE INTO equipos (codigo, numero, categoria, tipo, hfc, marca, modelo, numero_serie, ubicacion, condicion, observaciones) VALUES
  ('MENOR-1',  1,  'MENOR_40000_BTU', 'SPLIT/CIELO', 'R-22',   'CLARK',      'CSU-24HR03',      'E-013-03-6898',           'BIBLIOTECA 2° PISO',              'ACTIVO',           NULL),
  ('MENOR-2',  2,  'MENOR_40000_BTU', 'SPLIT/CIELO', 'R-410A', 'TOSHIBA',    'RAS-24SKHP-ES2',  '02500013/02400043',       'SALA SERVIDORES',                 'ACTIVO',           'A/P 2025'),
  ('MENOR-3',  3,  'MENOR_40000_BTU', 'VENTANA',     'R-22',   'PANASONIC',  'NN',              '117022E',                 'DEPARTAMENTO CURRICULAR',         'ACTIVO',           NULL),
  ('MENOR-4',  4,  'MENOR_40000_BTU', 'SPLIT/PISO',  'R-22',   'LENNOX',     'LXLC25BR AFEA',   '20480202OO164',           'OFICINA DIRECTOR',                'ACTIVO',           NULL),
  ('MENOR-5',  5,  'MENOR_40000_BTU', 'SPLIT/CIELO', 'R-410A', 'SHOOT AIRE', 'ECO-24INTG/EXTG', '63229977661/662',         'SALA DE EX - DIRECTORES',         'ACTIVO',           NULL),
  ('MENOR-6',  6,  'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '240300511027111002112-A', 'OFICINA SUBDIRECTOR',             'ACTIVO',           NULL),
  ('MENOR-7',  7,  'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '240300511027111002112-B', 'CASINO DIRECCION',                'ACTIVO',           NULL),
  ('MENOR-8',  8,  'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '240300511027111002112-C', 'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-9',  9,  'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '240300511027111002112-D', 'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-10', 10, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-A',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-11', 11, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-B',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-12', 12, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-C',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-13', 13, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-D',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-14', 14, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-E',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-15', 15, 'MENOR_40000_BTU', 'VENTANA',     'R-410A', 'CLARK',      'CW-12HRE',        '2403005110271110144-F',   'EDIFICIO ADMINISTRATIVO 2° PISO', 'ACTIVO',           NULL),
  ('MENOR-16', 16, 'MENOR_40000_BTU', 'VENTANA',     'R-22',   'YORK',       'Y6USE09-5XX',     'P2ET800051',              'OFICINA PROTOCOLO',               'ACTIVO',           NULL),
  ('MENOR-17', 17, 'MENOR_40000_BTU', 'VENTANA',     'R-22',   'WESTING',    'AX12EW5C5',       'JK71404446',              'TALLERES',                        'POR_BAJA',         'P/BAJA');

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos(codigo);
CREATE INDEX IF NOT EXISTS idx_equipos_condicion ON equipos(condicion);
CREATE INDEX IF NOT EXISTS idx_equipos_categoria ON equipos(categoria);
CREATE INDEX IF NOT EXISTS idx_bitacora_equipo ON bitacora_mantenimiento(equipo_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_mantenimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_bitacora_proximo ON bitacora_mantenimiento(proximo_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_inspecciones_equipo ON inspecciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado);
