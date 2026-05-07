const mysql = require('mysql2/promise');

async function insertAllSampleData() {
  console.log('=== INSERTANDO DATOS DE PRUEBA EN TODAS LAS TABLAS PAT ===\n');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba'
  });
  
  const connection = await pool.getConnection();
  
  try {
    // 1. TABLA: pre_unid_med_ptrabajo (Unidades)
    console.log('📋 1. Tabla pre_unid_med_ptrabajo (Unidades):');
    const unidades = [
      { cod_unidad: 'UNIDAD01', nom_unidad: 'Dirección de Sistemas', estado: 1 },
      { cod_unidad: 'UNIDAD02', nom_unidad: 'Oficina de Administración', estado: 1 },
      { cod_unidad: 'UNIDAD03', nom_unidad: 'Recursos Humanos', estado: 1 },
      { cod_unidad: 'UNIDAD04', nom_unidad: 'Contabilidad', estado: 1 },
      { cod_unidad: 'UNIDAD05', nom_unidad: 'Almacén Central', estado: 1 }
    ];
    
    for (const u of unidades) {
      try {
        await connection.query(
          'INSERT INTO pre_unid_med_ptrabajo (cod_unidad, nom_unidad, estado) VALUES (?, ?, ?)',
          [u.cod_unidad, u.nom_unidad, u.estado]
        );
        console.log(`   ✅ ${u.cod_unidad}: ${u.nom_unidad}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`   ⚠️  ${u.cod_unidad} ya existe`);
        else console.log(`   ❌ ${u.cod_unidad}: ${e.message}`);
      }
    }
    
    // 2. TABLA: pat_usu (Usuarios)
    console.log('\n👤 2. Tabla pat_usu (Usuarios):');
    const usuarios = [
      { idpatusu: 'admin', nombres: 'Administrador', apellidos: 'del Sistema', cargo: 'Administrador', estado: 1, password_hash: '$2a$10$xxxxxxxxxxxxxxxx' },
      { idpatusu: 'jperez', nombres: 'Juan', apellidos: 'Pérez García', cargo: 'Técnico', estado: 1 },
      { idpatusu: 'mlopez', nombres: 'María', apellidos: 'López Torres', cargo: 'Registrador', estado: 1 },
      { idpatusu: 'crodriguez', nombres: 'Carlos', apellidos: 'Rodríguez Díaz', cargo: 'Analista', estado: 1 },
      { idpatusu: 'agarcia', nombres: 'Ana', apellidos: 'García Flores', cargo: 'Supervisor', estado: 1 }
    ];
    
    for (const u of usuarios) {
      try {
        await connection.query(
          'INSERT INTO pat_usu (idpatusu, nombres, apellidos, cargo, estado, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
          [u.idpatusu, u.nombres, u.apellidos, u.cargo, u.estado, u.password_hash || null]
        );
        console.log(`   ✅ ${u.idpatusu}: ${u.nombres} ${u.apellidos} (${u.cargo})`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`   ⚠️  ${u.idpatusu} ya existe`);
        else console.log(`   ❌ ${u.idpatusu}: ${e.message}`);
      }
    }
    
    // 3. TABLA: pat_bien (Bienes) - más datos
    console.log('\n📦 3. Tabla pat_bien (Bienes):');
    const bienes = [
      { codbien: 'LAP001', descbien: 'Laptop Dell Latitude 5430', ubicacion: 'Oficina Sistemas', duniorqa: 'UNIDAD01', estadobien: 'A', idpatusu: 'admin', marca: 'Dell', modelo: 'Latitude 5430', tpbien: 'EQUIPOS' },
      { codbien: 'MON001', descbien: 'Monitor Samsung 24 pulgadas', ubicacion: 'Oficina Sistemas', duniorqa: 'UNIDAD01', estadobien: 'A', idpatusu: 'admin', marca: 'Samsung', modelo: 'S24F350', tpbien: 'EQUIPOS' },
      { codbien: 'IMP001', descbien: 'Impresora HP LaserJet Pro', ubicacion: 'Recepción', duniorqa: 'UNIDAD02', estadobien: 'A', idpatusu: 'mlopez', marca: 'HP', modelo: 'M404dn', tpbien: 'EQUIPOS' },
      { codbien: 'ESC001', descbien: 'Escritorio ejecutivo de madera', ubicacion: 'Dirección', duniorqa: 'UNIDAD01', estadobien: 'A', idpatusu: 'admin', marca: 'Muebles SA', modelo: 'Ejecutivo', tpbien: 'MUEBLES' },
      { codbien: 'SILL001', descbien: 'Silla ergonómica ajustable', ubicacion: 'Oficina Sistemas', duniorqa: 'UNIDAD01', estadobien: 'A', idpatusu: 'jperez', marca: 'Herman Miller', modelo: 'Aeron', tpbien: 'MUEBLES' },
      { codbien: 'SERV001', descbien: 'Servidor Dell PowerEdge', ubicacion: 'Data Center', duniorqa: 'UNIDAD01', estadobien: 'A', idpatusu: 'admin', marca: 'Dell', modelo: 'R740', tpbien: 'EQUIPOS' },
      { codbien: 'PROY001', descbien: 'Proyector Epson Full HD', ubicacion: 'Sala Reuniones', duniorqa: 'UNIDAD02', estadobien: 'A', idpatusu: 'mlopez', marca: 'Epson', modelo: 'EB-U05', tpbien: 'EQUIPOS' },
      { codbien: 'AIRE001', descbien: 'Aire acondicionado split 12000 BTU', ubicacion: 'Oficina RRHH', duniorqa: 'UNIDAD03', estadobien: 'A', idpatusu: 'crodriguez', marca: 'Samsung', modelo: 'AR12', tpbien: 'EQUIPOS' },
      { codbien: 'ARCH001', descbien: 'Archivador metálico 4 cajones', ubicacion: 'Almacén', duniorqa: 'UNIDAD05', estadobien: 'A', idpatusu: 'agarcia', marca: 'Metalux', modelo: 'AR-4', tpbien: 'MUEBLES' },
      { codbien: 'CAM001', descbien: 'Cámara de seguridad IP', ubicacion: 'Pasillo Principal', duniorqa: 'UNIDAD02', estadobien: 'A', idpatusu: 'admin', marca: 'Hikvision', modelo: 'DS-2CD', tpbien: 'EQUIPOS' }
    ];
    
    for (const b of bienes) {
      try {
        await connection.query(
          'INSERT INTO pat_bien (codbien, descbien, ubicacion, duniorqa, estadobien, idpatusu, marca, modelo, tpbien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [b.codbien, b.descbien, b.ubicacion, b.duniorqa, b.estadobien, b.idpatusu, b.marca, b.modelo, b.tpbien]
        );
        console.log(`   ✅ ${b.codbien}: ${b.descbien}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`   ⚠️  ${b.codbien} ya existe`);
        else console.log(`   ❌ ${b.codbien}: ${e.message}`);
      }
    }
    
    // 4. TABLA: pat_detabaja (Bajas de bienes) - ejemplo
    console.log('\n🗑️  4. Tabla pat_detabaja (Bajas):');
    const bajas = [
      { codbien: 'BIEN_OLD01', descbien: 'Laptop antigua HP', duniorqa: 'UNIDAD01', fecha: new Date('2024-01-15'), motivo: 'Obsolescencia técnica', dado_baja_por: 'admin' },
      { codbien: 'BIEN_OLD02', descbien: 'Monitor CRT 17 pulgadas', duniorqa: 'UNIDAD02', fecha: new Date('2024-02-20'), motivo: 'Daño irreparable', dado_baja_por: 'mlopez' }
    ];
    
    for (const b of bajas) {
      try {
        // Verificar si la tabla tiene las columnas necesarias
        const [columns] = await connection.query('DESCRIBE pat_detabaja');
        const columnNames = columns.map(c => c.Field);
        
        const fields = [];
        const values = [];
        
        if (columnNames.includes('codbien')) { fields.push('codbien'); values.push(b.codbien); }
        if (columnNames.includes('descbien')) { fields.push('descbien'); values.push(b.descbien); }
        if (columnNames.includes('descripcion')) { fields.push('descripcion'); values.push(b.descbien); }
        if (columnNames.includes('duniorqa')) { fields.push('duniorqa'); values.push(b.duniorqa); }
        if (columnNames.includes('motivo')) { fields.push('motivo'); values.push(b.motivo); }
        if (columnNames.includes('dado_baja_por')) { fields.push('dado_baja_por'); values.push(b.dado_baja_por); }
        if (columnNames.includes('usuario_baja')) { fields.push('usuario_baja'); values.push(b.dado_baja_por); }
        
        // Buscar columna de fecha
        const fechaCol = columnNames.find(c => c.toLowerCase().includes('fec') || c.toLowerCase().includes('fecha'));
        if (fechaCol) { fields.push(fechaCol); values.push(b.fecha); }
        
        if (fields.length > 0) {
          const placeholders = fields.map(() => '?').join(', ');
          await connection.query(
            `INSERT INTO pat_detabaja (${fields.join(', ')}) VALUES (${placeholders})`,
            values
          );
          console.log(`   ✅ ${b.codbien}: ${b.descbien}`);
        }
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') console.log(`   ⚠️  ${b.codbien} ya existe`);
        else console.log(`   ❌ ${b.codbien}: ${e.message}`);
      }
    }
    
    // RESUMEN
    console.log('\n=== RESUMEN DE DATOS INSERTADOS ===');
    const [totalUnidades] = await connection.query('SELECT COUNT(*) as n FROM pre_unid_med_ptrabajo');
    const [totalUsuarios] = await connection.query('SELECT COUNT(*) as n FROM pat_usu');
    const [totalBienes] = await connection.query('SELECT COUNT(*) as n FROM pat_bien');
    const [totalBajas] = await connection.query('SELECT COUNT(*) as n FROM pat_detabaja');
    
    console.log(`📊 pre_unid_med_ptrabajo: ${totalUnidades[0].n} unidades`);
    console.log(`👤 pat_usu: ${totalUsuarios[0].n} usuarios`);
    console.log(`📦 pat_bien: ${totalBienes[0].n} bienes`);
    console.log(`🗑️  pat_detabaja: ${totalBajas[0].n} bajas`);
    
    console.log('\n✅ DATOS DE PRUEBA INSERTADOS EXITOSAMENTE');
    console.log('🔄 Recarga el APK para ver todos los datos');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

insertAllSampleData();
