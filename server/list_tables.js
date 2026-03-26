const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log(`\n📂 Database: ${process.env.DB_NAME}\n`);

    // 1. Show all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${process.env.DB_NAME}`;

    if (tables.length === 0) {
      console.log('❌ No tables found.');
    } else {
      for (const row of tables) {
        const tableName = row[tableKey];
        console.log(`=========================================`);
        console.log(`📑 Table: ${tableName}`);
        console.log(`=========================================`);
        
        // 2. Describe each table
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        console.table(columns.map(c => ({
          Field: c.Field,
          Type: c.Type,
          Null: c.Null,
          Key: c.Key,
          Default: c.Default,
          Extra: c.Extra
        })));
        console.log('\n');
      }
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

listTables();
