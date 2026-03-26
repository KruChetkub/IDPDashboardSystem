const mysql = require('mysql2/promise');
require('dotenv').config();

async function listUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [users] = await connection.query("SELECT id, username, role, status FROM users");
    console.log("USERS LIST:", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

listUsers();
