const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // ต้องใส่ใน .env
  database: process.env.DB_NAME || 'idp_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// แปลง pool เป็น promise-based เพื่อให้ใช้ async/await ได้
const promisePool = pool.promise();

// Test Connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.code);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = promisePool;
