const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DB_NAME
    });

    const [rows] = await connection.query('SELECT id, username, role, status FROM users'); // Added status
    console.log('--- USER ROLES & STATUS IN DB ---');
    console.log(JSON.stringify(rows, null, 2)); 
    console.log('------------------------');
    await connection.end();
    process.exit(0);

  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

checkUsers();
