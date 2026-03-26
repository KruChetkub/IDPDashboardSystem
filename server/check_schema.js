const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.query('DESCRIBE users');
    console.log('--- USERS TABLE SCHEMA ---');
    console.table(rows);
    console.log('------------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

checkSchema();
