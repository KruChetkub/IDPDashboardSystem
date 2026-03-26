import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import Custom Components
import AdminStats from '../components/admin/AdminStats';
import UserTable from '../components/admin/UserTable';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  // Get Current User ID safely
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 0;
      return JSON.parse(atob(token.split('.')[1])).id;
    } catch (e) {
      return 0;
    }
  };
  const currentUserId = getCurrentUserId();

  // --- API Functions ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(lowerTerm) ||
      user.role.toLowerCase().includes(lowerTerm) ||
      user.status.toLowerCase().includes(lowerTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // --- Action Handlers ---
  const handleApprove = async (userId) => {
    if (!confirm('Are you sure you want to approve this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        // Optimistic Update
        const updatedUsers = users.map(u => u.id === userId ? { ...u, status: 'active' } : u);
        setUsers(updatedUsers);
      } else {
        alert('Failed to approve');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole.toUpperCase()}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
         // Optimistic Update
         const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
         setUsers(updatedUsers);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Optimistic Update
        const remainingUsers = users.filter(u => u.id !== userId);
        setUsers(remainingUsers);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <ShieldCheck size={28} />
              </div>
              Admin Control Panel
            </h1>
            <p className="text-slate-500 mt-1 ml-1">Manage users, roles, and system access</p>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-white px-4 py-2 rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>

        {/* Stats Section */}
        <AdminStats users={users} />

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name, role, or status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
          {/* Add User Button (Future Feature) */}
          {/* <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors">+ Add User</button> */}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-center">
            <span className="font-bold mr-2">Error:</span> {error}
          </div>
        )}

        {/* User Table Component */}
        <UserTable 
          users={filteredUsers} 
          currentUserId={currentUserId}
          onApprove={handleApprove}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
        />

      </div>
    </div>
  );
}
