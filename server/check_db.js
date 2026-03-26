const db = require('./db');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'db_check.log');
function log(msg) {
  fs.appendFileSync(logFile, msg + '\n');
}

async function checkAndInit() {
  try {
    log('Checking database connection...');
    
    // Check if users table exists
    const [rows] = await db.query("SHOW TABLES LIKE 'users'");
    
    if (rows.length === 0) {
      log('Users table NOT found. Initializing database...');
      
      const initSqlPath = path.join(__dirname, '../database/init.sql');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = initSql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const stmt of statements) {
        await db.query(stmt);
      }
      
      log('Database initialized successfully!');
    } else {
      log('Users table FOUND. Database is ready.');
    }

    // Verify
    const [users] = await db.query("SELECT count(*) as count FROM users");
    log(`Current user count: ${users[0].count}`);

    process.exit(0);
  } catch (error) {
    log('Error during check: ' + error);
    process.exit(1);
  }
}

checkAndInit();
