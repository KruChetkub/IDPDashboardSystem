import React from 'react';
import { CheckCircle, Clock, Trash2, Key, Search } from 'lucide-react';

export default function UserTable({ users, currentUserId, onApprove, onRoleChange, onDelete }) {
  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Search size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No users found</h3>
        <p className="text-slate-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                
                {/* User Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm mr-3 shadow-md">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white flex items-center">
                        {user.username}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">You</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">ID: #{user.id} • Joined {new Date(user.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>

                {/* Role Column */}
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onRoleChange(user.id, user.role)}
                    disabled={user.id === currentUserId}
                    className={`
                      relative group/role px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-200
                      ${user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}
                      ${user.id === currentUserId ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
                    `}
                    title={user.id === currentUserId ? "Cannot change your own role" : "Click to toggle role"}
                  >
                    <Key size={14} className={user.role === 'admin' ? 'fill-current' : ''} />
                    {user.role.toUpperCase()}
                  </button>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4">
                   {user.status === 'active' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle size={12} className="mr-1" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                      <Clock size={12} className="mr-1" /> Pending
                    </span>
                  )}
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {user.status === 'pending' && (
                      <button 
                        onClick={() => onApprove(user.id)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow active:scale-95 transition-all"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                    
                    {user.id !== currentUserId && (
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                         <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
