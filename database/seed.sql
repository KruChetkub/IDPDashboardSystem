USE idp_system;

-- เพิ่มข้อมูล User จำลอง
INSERT INTO users (username, password_hash, role) VALUES 
('test_admin', '$2b$10$DummyHashForTestOnly', 'admin'),
('test_user', '$2b$10$DummyHashForTestOnly', 'user');

-- เพิ่มข้อมูล Employee จำลอง
INSERT INTO employees (emp_code, first_name, last_name, position, department) VALUES
('test_admin', 'Admin', 'TestSystem', 'System Administrator', 'IT'),
('test_user', 'User', 'TestSystem', 'HR Officer', 'Human Resource');
