const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Use console.error to avoid stdout buffering issues if any
    console.error(`Connected to ${process.env.DB_NAME}`);
    
    const [rows] = await connection.query('SHOW TABLES');
    console.error('Tables found:', rows.length);
    rows.forEach(r => console.error(' - ' + Object.values(r)[0]));
    
    await connection.end();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
