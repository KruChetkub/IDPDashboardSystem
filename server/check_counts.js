const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEmployees() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await connection.query('SELECT count(*) as count FROM employees');
    console.log('Employees count:', rows[0].count);
    
    // Also check idp_plans to see if we have orphan plans or linked plans
    const [plans] = await connection.query('SELECT count(*) as count FROM idp_plans');
    console.log('IDP Plans count:', plans[0].count);

    await connection.end();
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkEmployees();
