// Script de un solo uso: genera el hash bcrypt de una contraseña,
// para crear el PRIMER usuario Administrador directamente por SQL
// (los siguientes usuarios ya se crean desde la página Usuarios,
// una vez que exista un Administrador con el cual iniciar sesión).
//
// Uso (desde la carpeta backend, con las dependencias instaladas):
//   node generar_hash.js miContrasena123

const bcrypt = require('bcryptjs');

const contrasena = process.argv[2];

if (!contrasena) {
    console.log('Uso: node generar_hash.js <contrasena>');
    process.exit(1);
}

const hash = bcrypt.hashSync(contrasena, 10);

console.log('\nContraseña en texto plano:', contrasena);
console.log('Hash bcrypt (pégalo en el INSERT de SQL):\n');
console.log(hash);
console.log('');
