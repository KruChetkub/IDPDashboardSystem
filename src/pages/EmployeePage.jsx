import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Briefcase, Trash2, Edit2, Save, X, ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    emp_code: '',
    prefix: 'นาย',
    first_name: '',
    last_name: '',
    position: '',
    department: '',
    group_work: ''
  });

  const navigate = useNavigate();

  // --- API Functions ---
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = employees.filter(emp => 
      emp.first_name.toLowerCase().includes(lowerTerm) ||
      emp.last_name.toLowerCase().includes(lowerTerm) ||
      emp.emp_code.toLowerCase().includes(lowerTerm) ||
      (emp.position && emp.position.toLowerCase().includes(lowerTerm))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/employees/${currentId}` : '/api/employees';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(isEditing ? 'Employee updated!' : 'Employee added!');
        setIsModalOpen(false);
        fetchEmployees(); // Refresh list
        resetForm();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setEmployees(employees.filter(e => e.id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setFormData({
      emp_code: emp.emp_code || '',
      prefix: emp.prefix || 'นาย',
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      position: emp.position || '',
      department: emp.department || '',
      group_work: emp.group_work || ''
    });
    setCurrentId(emp.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      emp_code: '',
      prefix: 'นาย',
      first_name: '',
      last_name: '',
      position: '',
      department: '',
      group_work: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };


  const handleImport = async () => {
    if (!confirm('Import data from Google Sheets? This might take a few seconds.')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchEmployees();
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 animate-pulse">Loading data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Users size={28} />
              </div>
              Personnel List
            </h1>
            <p className="text-slate-500 mt-1 ml-1">Manage employee records and information</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-white px-4 py-2 rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Save size={18} /> Import from Sheets
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <UserPlus size={18} /> Add New Employee
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex items-center gap-4">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by ID, Name, Position..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{emp.emp_code}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                      {emp.prefix} {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{emp.position || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <div className="flex flex-col">
                        <span>{emp.department || '-'}</span>
                        <span className="text-xs text-slate-400">{emp.group_work}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No employees found. Click "Add New Employee" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {isEditing ? <Edit2 size={18} /> : <UserPlus size={18} />}
                {isEditing ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee Code *</label>
                  <input 
                    type="text" name="emp_code" required
                    value={formData.emp_code} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="e.g. 64001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prefix</label>
                  <select 
                    name="prefix" 
                    value={formData.prefix} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ดร.">ดร.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input 
                    type="text" name="first_name" required
                    value={formData.first_name} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input 
                    type="text" name="last_name" required
                    value={formData.last_name} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="Last Name"
                  />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Position</label>
                   <input 
                    type="text" name="position"
                    value={formData.position} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input 
                    type="text" name="department"
                    value={formData.department} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="e.g. IT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Work</label>
                  <input 
                    type="text" name="group_work"
                    value={formData.group_work} onChange={handleInputChange}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="e.g. Software Development"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} /> Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
