-- 1. สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS idp_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. เลือกใช้งานฐานข้อมูลนี้
USE idp_system;

-- 3. สร้างตาราง Users (สำหรับ login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'รหัสพนักงาน หรือ Username',
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. สร้างตาราง Employees (ข้อมูลส่วนตัว)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(50) UNIQUE COMMENT 'รหัสพนักงาน (เชื่อมกับ Users)',
    prefix VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    position VARCHAR(100),
    department VARCHAR(100),
    group_work VARCHAR(100),
    -- เชื่อม Foreign Key ไปหา Users (Optional)
    FOREIGN KEY (emp_code) REFERENCES users(username) ON DELETE SET NULL
);

-- 5. สร้างตาราง IDP Plans (แผนพัฒนา)
CREATE TABLE IF NOT EXISTS idp_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL COMMENT 'เชื่อมกับตาราง employees',
    fiscal_year INT COMMENT 'ปีงบประมาณ',
    topic TEXT COMMENT 'หัวข้อการพัฒนา',
    dev_type VARCHAR(50) COMMENT 'ประเภท (ความรู้/ทักษะ/สมรรถนะ)',
    target INT DEFAULT 0,
    actual INT DEFAULT 0,
    gap INT DEFAULT 0,
    method_70 TEXT,
    method_20 TEXT,
    method_10 TEXT,
    start_month VARCHAR(20),
    end_month VARCHAR(20),
    budget DECIMAL(10,2) DEFAULT 0.00,
    kpi TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emp_id) REFERENCES employees(id) ON DELETE CASCADE
);

