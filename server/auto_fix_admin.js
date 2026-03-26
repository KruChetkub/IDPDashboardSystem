const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1. Get the first user (by ID)
    const [users] = await connection.query("SELECT id, username, role, status FROM users ORDER BY id ASC LIMIT 1");
    
    if (users.length === 0) {
      console.log("No users found.");
      return;
    }

    const firstUser = users[0];
    console.log("First User:", firstUser);

    // 2. Update to Admin and Active
    if (firstUser.role !== 'admin' || firstUser.status !== 'active') {
      await connection.query("UPDATE users SET role = 'admin', status = 'active' WHERE id = ?", [firstUser.id]);
      console.log(`UPDATED user ${firstUser.username} to ADMIN/ACTIVE.`);
    } else {
        console.log(`User ${firstUser.username} is already ADMIN/ACTIVE.`);
    }

  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

fixAdmin();
