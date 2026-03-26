const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateData() {
  console.log('🚀 Starting Data Migration...');

  // 1. Fetch CSV Data from Google Sheets
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;
  if (!sheetUrl) {
    console.error('❌ Error: GOOGLE_SHEET_CSV_URL not found in .env');
    return;
  }

  console.log('📥 Fetching data from Google Sheets...');
  const response = await fetch(sheetUrl);
  if (!response.ok) {
    console.error(`❌ Failed to fetch data: ${response.statusText}`);
    return;
  }
  const text = await response.text();

  // 2. Parse CSV (Logic similar to Frontend App.jsx)
  const rows = text.split('\n').map(row => {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; // Regex to handle commas inside quotes
    return row.split(regex).map(cell => cell ? cell.replace(/^"|"$/g, '').trim() : '');
  }).filter(r => r.length > 5); // Filter empty rows

  // Skip header row
  const dataRows = rows.slice(1);
  console.log(`📊 Found ${dataRows.length} rows to process.`);

  // 3. Connect to Database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 4. Process each row
    for (const row of dataRows) {
      // Map CSV columns to variables (Based on App.jsx logic)
      const year = row[0];
      // const no = row[1]; // Not used
      const department = row[2];
      let groupWork = row[3];
      // Normalization logic
      if (groupWork && groupWork === 'แผนปฏิบัติราชการ') groupWork = 'กลุ่มแผนปฏิบัติราชการ';
      
      const fullName = row[4]; // Name like "นาย สมชาย ใจดี"
      const position = row[5];
      // const evaluator = row[6]; // Not used in DB yet
      
      // IDP Plan Data
      const devType = row[7];
      const topic = row[8];
      const target = parseInt(row[9]) || 0;
      const actual = parseInt(row[10]) || 0;
      const gap = parseInt(row[11]) || 0;
      const method70 = row[12];
      const method20 = row[13];
      const method10 = row[14];
      const startMonth = row[15];
      const endMonth = row[16];
      const budget = parseFloat(row[17]) || 0;
      const kpi = row[18]?.replace('\r', '');

      if (!fullName) continue;

      // Extract Firstname/Lastname
      const nameParts = fullName.split(' ');
      const prefix = nameParts[0]; // Simple assumption, might need refinement
      const firstName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
      const lastName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : '';

      // Generate a temporary emp_code (using checksum or name)
      // For now, let's use first_name + last_name as unique identifier logic
      // Ensure english characters or just use a stable ID logic if possible.
      // Since names are Thai, this might be tricky if emp_code matches user.username.
      // Let's assume for migration we might need a better username strategy or just use email if available?
      // For now, let's try to map keys.
      
      const empCode = `${firstName}.${lastName || 'xx'}`; 

      // --- 1. Ensure User Exists (Fix for Foreign Key Constraint) ---
      // password_hash = default 'password' (bcrypt hash example)
      const defaultPasswordHash = '$2b$10$EpOd/ExampleHash...'; 
      
      await connection.execute(
        `INSERT IGNORE INTO users (username, password_hash, role) VALUES (?, ?, 'user')`,
        [empCode, defaultPasswordHash]
      );

      // --- 2. Insert into Employees Table ---
      // Use INSERT IGNORE or ON DUPLICATE KEY UPDATE to avoid duplicates
      const [empResult] = await connection.execute(
        `INSERT INTO employees (emp_code, prefix, first_name, last_name, position, department, group_work) 
         VALUES (?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE position=VALUES(position), department=VALUES(department), group_work=VALUES(group_work)`,
        [empCode, prefix, firstName, lastName, position, department, groupWork]
      );

      // Get Employee ID
      let empId;
      if (empResult.insertId) {
        empId = empResult.insertId;
      } else {
        // If updated, fetching ID might be needed
        const [existing] = await connection.execute('SELECT id FROM employees WHERE emp_code = ?', [empCode]);
        empId = existing[0].id;
      }

      // --- 3. Insert into IDP Plans Table ---
      await connection.execute(
        `INSERT INTO idp_plans (emp_id, fiscal_year, topic, dev_type, target, actual, gap, method_70, method_20, method_10, start_month, end_month, budget, kpi)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [empId, year, topic, devType, target, actual, gap, method70, method20, method10, startMonth, endMonth, budget, kpi]
      );
    }

    console.log('✅ Migration Completed Successfully!');

  } catch (error) {
    console.error('❌ Migration Failed:', error);
  } finally {
    await connection.end();
  }
}

migrateData();
