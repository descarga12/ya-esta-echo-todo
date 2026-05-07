-- DATOS DE PRUEBA PARA SISTEMA PAT
-- Ejecutar en MySQL (phpMyAdmin o línea de comandos)

-- 1. UNIDADES ORGÁNICAS
INSERT INTO pre_unid_med_ptrabajo (cod_unidad, nom_unidad, estado) VALUES
('UNIDAD01', 'Dirección de Sistemas', 1),
('UNIDAD02', 'Oficina de Administración', 1),
('UNIDAD03', 'Recursos Humanos', 1),
('UNIDAD04', 'Contabilidad', 1),
('UNIDAD05', 'Almacén Central', 1)
ON DUPLICATE KEY UPDATE nom_unidad=VALUES(nom_unidad);

-- 2. USUARIOS
INSERT INTO pat_usu (idpatusu, nombres, apellidos, cargo, estado) VALUES
('admin', 'Administrador', 'del Sistema', 'Administrador', 1),
('jperez', 'Juan', 'Pérez García', 'Técnico', 1),
('mlopez', 'María', 'López Torres', 'Registrador', 1),
('crodriguez', 'Carlos', 'Rodríguez Díaz', 'Analista', 1),
('agarcia', 'Ana', 'García Flores', 'Supervisor', 1)
ON DUPLICATE KEY UPDATE nombres=VALUES(nombres), apellidos=VALUES(apellidos);

-- 3. BIENES
INSERT INTO pat_bien (codbien, descbien, ubicacion, duniorqa, estadobien, idpatusu, marca, modelo, tpbien) VALUES
('LAP001', 'Laptop Dell Latitude 5430', 'Oficina Sistemas', 'UNIDAD01', 'A', 'admin', 'Dell', 'Latitude 5430', 'EQUIPOS'),
('MON001', 'Monitor Samsung 24 pulgadas', 'Oficina Sistemas', 'UNIDAD01', 'A', 'admin', 'Samsung', 'S24F350', 'EQUIPOS'),
('IMP001', 'Impresora HP LaserJet Pro', 'Recepción', 'UNIDAD02', 'A', 'mlopez', 'HP', 'M404dn', 'EQUIPOS'),
('ESC001', 'Escritorio ejecutivo de madera', 'Dirección', 'UNIDAD01', 'A', 'admin', 'Muebles SA', 'Ejecutivo', 'MUEBLES'),
('SILL001', 'Silla ergonómica ajustable', 'Oficina Sistemas', 'UNIDAD01', 'A', 'jperez', 'Herman Miller', 'Aeron', 'MUEBLES'),
('SERV001', 'Servidor Dell PowerEdge', 'Data Center', 'UNIDAD01', 'A', 'admin', 'Dell', 'R740', 'EQUIPOS'),
('PROY001', 'Proyector Epson Full HD', 'Sala Reuniones', 'UNIDAD02', 'A', 'mlopez', 'Epson', 'EB-U05', 'EQUIPOS'),
('AIRE001', 'Aire acondicionado split 12000 BTU', 'Oficina RRHH', 'UNIDAD03', 'A', 'crodriguez', 'Samsung', 'AR12', 'EQUIPOS'),
('ARCH001', 'Archivador metálico 4 cajones', 'Almacén', 'UNIDAD05', 'A', 'agarcia', 'Metalux', 'AR-4', 'MUEBLES'),
('CAM001', 'Cámara de seguridad IP', 'Pasillo Principal', 'UNIDAD02', 'A', 'admin', 'Hikvision', 'DS-2CD', 'EQUIPOS'),
('TELE001', 'Teléfono IP Cisco', 'Oficina Contable', 'UNIDAD04', 'A', 'admin', 'Cisco', 'IP Phone 8841', 'EQUIPOS'),
('SCAN001', 'Escáner de documentos', 'Recepción', 'UNIDAD02', 'A', 'mlopez', 'Fujitsu', 'ScanSnap', 'EQUIPOS'),
('MESA001', 'Mesa de reuniones 8 personas', 'Sala Reuniones', 'UNIDAD02', 'A', 'admin', 'Muebles Pro', 'MR-8', 'MUEBLES')
ON DUPLICATE KEY UPDATE descbien=VALUES(descbien), ubicacion=VALUES(ubicacion);

-- 4. BAJAS (si la tabla existe)
-- INSERT INTO pat_detabaja (codbien, descbien, duniorqa, motivo, dado_baja_por) VALUES
-- ('BIEN_OLD01', 'Laptop antigua HP', 'UNIDAD01', 'Obsolescencia técnica', 'admin'),
-- ('BIEN_OLD02', 'Monitor CRT 17 pulgadas', 'UNIDAD02', 'Daño irreparable', 'mlopez');
