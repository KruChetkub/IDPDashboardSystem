import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';

// Basic Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Temporary bypass for development (Auto Login as Admin)
localStorage.setItem('token', 'mock-dev-token');
localStorage.setItem('role', 'admin');
localStorage.setItem('username', 'Dev Admin');

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Route: User Management
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        */}

        {/* Admin Route: Employee Management
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute adminOnly={true}>
              <EmployeePage />
            </ProtectedRoute>
          } 
        />
        */}

        {/* Default Redirect: Go to dashboard (which will redirect to login if not auth) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
