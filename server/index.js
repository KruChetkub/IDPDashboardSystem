const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Authentication Setup ---
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Import node-fetch
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_prod';

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Temporary Bypass for Development
  if (!token || token === 'mock-dev-token') {
    req.user = { id: 1, username: 'Dev Admin', role: 'admin', status: 'active' };
    return next();
  }

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'Username already exists' });

    // Check if this is the FIRST user
    const [allUsers] = await db.query('SELECT count(*) as count FROM users');
    const isFirstUser = allUsers[0].count === 0;
    
    // First user = Admin & Active. Others = User & Pending
    const role = isFirstUser ? 'admin' : 'user';
    const status = isFirstUser ? 'active' : 'pending';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await db.query('INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)', 
      [username, hashedPassword, role, status]);

    res.json({ message: 'User registered successfully', role, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    // Check Status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is pending approval. Please contact Admin.' });
    }

    // Generate Token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    console.log(`LOGIN SUCCESS: User=${user.username}, Role=${user.role}, Status=${user.status}`);

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Admin Routes ---

// Get All Users (Admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  try {
    const [users] = await db.query('SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Approve User (Admin only)
app.post('/api/admin/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { userId } = req.body;

  try {
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Update User Role (Admin only)
app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;
  const { role } = req.body; // 'admin' or 'user'

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: `User updated to ${role}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete User (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;

  // Prevent deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- Employee Management Routes ---

// Helper to parse CSV Line (handles quotes)
const parseCSVLine = (text) => {
  const result = [];
  let curValue = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(curValue.trim());
      curValue = '';
    } else {
      curValue += char;
    }
  }
  result.push(curValue.trim());
  return result;
};

// 0. Import from Google Sheets (via Google Apps Script API)
app.post('/api/employees/import', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  try {
    const gasUrl = process.env.GOOGLE_GAS_API_URL;
    const apiKey = process.env.GOOGLE_GAS_API_KEY;

    if (!gasUrl) {
      return res.status(500).json({ error: 'GOOGLE_GAS_API_URL is not configured in .env' });
    }

    // Call GAS with API Key
    const fetchUrl = `${gasUrl}?key=${apiKey}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch from Google Apps Script');
    
    const jsonData = await response.json();
    if (jsonData.error) throw new Error(jsonData.error);

    let addedCount = 0;
    const processedNames = new Set();

    for (const item of jsonData) {
      const department = item['หน่วยงาน'];
      const group_work = item['กลุ่มงาน'];
      const fullName = item['ชื่อ-สกุล'];
      const position = item['ตำแหน่ง'];

      if (!fullName || processedNames.has(fullName)) continue;
      processedNames.add(fullName);

      // Split Name
      const parts = fullName.split(' ').filter(p => p.trim() !== '');
      let prefix = 'คุณ';
      let first_name = '';
      let last_name = '';

      if (parts.length >= 3) {
        prefix = parts[0];
        first_name = parts[1];
        last_name = parts.slice(2).join(' ');
      } else if (parts.length === 2) {
        if (['นาย', 'นาง', 'นางสาว', 'ดร.', 'ว่าที่ร้อยตรี'].includes(parts[0])) {
           prefix = parts[0];
           first_name = parts[1];
           last_name = '';
        } else {
           first_name = parts[0];
           last_name = parts[1];
        }
      } else {
        first_name = parts[0] || '';
      }
      
      const [existing] = await db.query(
        "SELECT id FROM employees WHERE first_name = ? AND last_name = ?", 
        [first_name, last_name]
      );

      if (existing.length === 0) {
         const emp_code = Math.floor(10000 + Math.random() * 90000).toString();
         const [userCheck] = await db.query("SELECT id FROM users WHERE username = ?", [emp_code]);
         if (userCheck.length === 0) {
            const hashedPassword = await bcrypt.hash(emp_code, 10); 
            await db.query("INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'user', 'active')", 
              [emp_code, hashedPassword]);
         }

         await db.query(
           "INSERT INTO employees (emp_code, prefix, first_name, last_name, position, department, group_work) VALUES (?, ?, ?, ?, ?, ?, ?)",
           [emp_code, prefix, first_name, last_name, position, department, group_work]
         );
         addedCount++;
      } else {
        await db.query(
           "UPDATE employees SET position=?, department=?, group_work=? WHERE id=?",
           [position, department, group_work, existing[0].id]
        );
      }
    }

    res.json({ message: `Import successful using GAS API. Added ${addedCount} new employees.` });

  } catch (error) {
    console.error("IMPORT ERROR:", error);
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// 1. Get All Employees
app.get('/api/employees', authenticateToken, async (req, res) => {
  // Allow all authenticated users or just admin? Usually Admin manages, but Users might need to see list.
  // For now, let's restrict management to Admin, but maybe reading to all? 
  // The requirements say "Personnel List" for adding data, implying Admin context.
  if (req.user.role !== 'admin') return res.sendStatus(403);

  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// 2. Add New Employee
app.post('/api/employees', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  const { emp_code, prefix, first_name, last_name, position, department, group_work } = req.body;
  
  // Basic Validation
  if (!emp_code || !first_name || !last_name) {
    return res.status(400).json({ error: 'Employee Code and Name are required' });
  }

  try {
    const sql = `
      INSERT INTO employees (emp_code, prefix, first_name, last_name, position, department, group_work)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [emp_code, prefix, first_name, last_name, position, department, group_work]);
    
    res.json({ message: 'Employee added successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Employee Code (Username) already exists' });
    }
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// 3. Update Employee
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;
  const { emp_code, prefix, first_name, last_name, position, department, group_work } = req.body;

  try {
    const sql = `
      UPDATE employees 
      SET emp_code=?, prefix=?, first_name=?, last_name=?, position=?, department=?, group_work=?
      WHERE id=?
    `;
    await db.query(sql, [emp_code, prefix, first_name, last_name, position, department, group_work, id]);
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// 4. Delete Employee
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { id } = req.params;

  try {
    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from API Server! 🚀' });
});

// Example Route: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Main API: Get All People with IDP Plans (Fetching directly from Google Apps Script to ensure live sync)
app.get('/api/people', async (req, res) => {
  try {
    const gasUrl = process.env.GOOGLE_GAS_API_URL;
    const apiKey = process.env.GOOGLE_GAS_API_KEY;

    if (!gasUrl) {
      return res.status(500).json({ error: 'GOOGLE_GAS_API_URL is not configured in .env' });
    }

    // Call GAS with API Key
    const fetchUrl = `${gasUrl}?key=${apiKey}`;
    console.log(`🚀 PEOPLE: Fetching from GAS: ${gasUrl}`);
    const response = await fetch(fetchUrl);
    console.log(`📡 GAS Response Status: ${response.status}`);
    
    if (!response.ok) throw new Error('Failed to fetch from Google Apps Script');
    
    const jsonData = await response.json();
    if (jsonData.error) throw new Error(jsonData.error);
    
    // Map GAS results to Dashboard format
    const results = jsonData.map(item => ({
        year: item['ปีงบประมาณ'],
        department: item['หน่วยงาน'],
        group: item['กลุ่มงาน'],
        name: item['ชื่อ-สกุล'],
        position: item['ตำแหน่ง'],
        evaluator: item['ผู้ประเมิน'],
        devType: item['ประเภทการพัฒนา'],
        topic: item['หัวข้อการพัฒนา'],
        target: item['ระดับคาดหวัง(Target)'],
        actual: item['ผลประเมิน(Actual)'],
        gap: item['ค่าGap'],
        method70: item['วิธีการ_70(ปฏิบัติ)'],
        method20: item['วิธีการ_20(พี่เลี้ยง)'],
        method10: item['วิธีการ_10(อบรม)'],
        startMonth: item['เดือนเริ่มต้น'],
        endMonth: item['เดือนสิ้นสุด'],
        budget: item['งบประมาณ'],
        kpi: item['ตัวชี้วัด(KPI)']
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch data from GAS API: ' + error.message });
  }
});

// --- Start Server & Database Check ---
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Check and update schema
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'status'");
    if (columns.length === 0) {
      console.log("ℹ️ Column 'status' missing. Adding...");
      await db.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'pending') DEFAULT 'pending' AFTER role");
      console.log("✅ Column 'status' added.");
    }
    
    // Ensure at least one admin exists and is active
    const [users] = await db.query("SELECT id FROM users ORDER BY id ASC LIMIT 1");
    if (users.length > 0) {
       await db.query("UPDATE users SET role = 'admin', status = 'active' WHERE id = ?", [users[0].id]);
       console.log(`✅ Ensured User ID ${users[0].id} is Admin & Active`);
    }

    // Default others to pending if null
    await db.query("UPDATE users SET status = 'pending' WHERE status IS NULL");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
