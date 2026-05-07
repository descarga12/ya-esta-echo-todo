/**
 * Agrega un usuario administrador
 * Ejecutar: node add-admin.cjs
 */
const mysql = require('mysql2/promise');

async function addAdmin() {
  const config = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'prueba'
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Obtener el próximo ID
    const [maxId] = await connection.query("SELECT MAX(id) as max_id FROM pat_usu");
    const newId = (maxId[0].max_id || 0) + 1;
    
    // Crear usuario admin
    const adminData = {
      id: newId,
      apenom: 'ADMINISTRADOR SISTEMA',
      nombres: 'ADMINISTRADOR',
      apellidos: 'SISTEMA',
      tipodoc: 'DNI',
      nrodoc: '11111111',
      estado: 1,
      profe: 'ADMIN',
      codlocal: null,
      idoficina: null,
      ofici: null,
      tipodecon: null,
      idusu: null,
      tipotra: 'A',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const fields = Object.keys(adminData).join(', ');
    const placeholders = Object.values(adminData).map(() => '?').join(', ');
    const values = Object.values(adminData);
    
    const query = `INSERT INTO pat_usu (${fields}) VALUES (${placeholders})`;
    
    console.log('Query:', query);
    console.log('Valores:', values);
    
    const [result] = await connection.query(query, values);
    
    console.log('\n✅ Administrador creado exitosamente');
    console.log('ID:', newId);
    console.log('Nombre: ADMINISTRADOR SISTEMA');
    console.log('DNI: 11111111');
    console.log('Estado: Activo');
    
    await connection.end();
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('\n⚠️ El usuario ya existe');
    }
  }
}

addAdmin();
