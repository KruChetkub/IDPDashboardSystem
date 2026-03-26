import React from 'react';
import { Users, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

export default function AdminStats({ users }) {
  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const pending = users.filter(u => u.status === 'pending').length;
  const admins = users.filter(u => u.role === 'admin').length;

  const stats = [
    { title: 'Total Users', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Users', value: active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Pending Approval', value: pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Admins', value: admins, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
