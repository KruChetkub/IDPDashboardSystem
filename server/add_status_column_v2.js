const mysql = require('mysql2/promise');
require('dotenv').config();

async function addStatusColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database. Adding status column...');

    // Check if column exists first
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
    
    if (columns.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'pending') DEFAULT 'pending' AFTER role");
      console.log("✅ Column 'status' added successfully.");
      
      // Update existing users to 'active' or 'pending'
      await connection.query("UPDATE users SET status = 'active' WHERE role = 'admin'"); // Admins are active
      console.log("✅ Updated Admin status to 'active'");
      
      await connection.query("UPDATE users SET status = 'pending' WHERE role != 'admin' AND status IS NULL");
      console.log("✅ Set default status for others");
      
    } else {
      console.log("ℹ️ Column 'status' already exists.");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    if (connection) await connection.end();
    console.log('Script finished.');
    process.exit(0);
  }
}

addStatusColumn();
