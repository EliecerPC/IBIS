// Script de uso puntual para generar un hash bcrypt.
// Se utiliza para crear el primer usuario Administrador directamente en PostgreSQL.
// Los usuarios posteriores se registran desde la aplicación IBIS.

// Importa bcryptjs para generar el hash de la contraseña.
const bcrypt = require('bcryptjs');

// Obtiene la contraseña recibida como argumento al ejecutar el script.
const contrasena = process.argv[2];

// Comprueba que se haya proporcionado una contraseña.
if (!contrasena) {
    console.log('Uso: node generar_hash.js <contrasena>');
    process.exit(1);
}

// Genera el hash de la contraseña utilizando un factor de costo de 10.
const hash = bcrypt.hashSync(contrasena, 10);

// Muestra el hash generado para utilizarlo al insertar el usuario en PostgreSQL.
console.log('\nContraseña en texto plano:', contrasena);
console.log('Hash bcrypt:\n');
console.log(hash);
console.log('');
