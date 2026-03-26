const db = require('./db');

async function updateSchema() {
  try {
    console.log('Checking users table schema...');
    
    // Check if 'status' column exists
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'status'");
    
    if (columns.length === 0) {
      console.log('Adding status column...');
      await db.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending' COMMENT 'active / pending' AFTER role");
      
      // Update existing users to 'active' so current users don't get locked out
      await db.query("UPDATE users SET status = 'active'");
      console.log('Status column added and existing users set to active.');
    } else {
      console.log('Status column already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();
