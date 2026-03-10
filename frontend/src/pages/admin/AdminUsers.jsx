import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { timeAgo, getInitials } from '../../utils/helpers';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, role, limit: 30 } });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const handleBan = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { isBanned: !isBanned });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: !isBanned } : u));
      toast.success(isBanned ? 'User unbanned' : 'User banned');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Users <span className="text-gray-400 font-normal text-base">({total})</span></h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="flex-1 py-2.5 text-sm outline-none" placeholder="Search by name or email" />
        </div>
        <div className="flex gap-2">
          {['', 'candidate', 'recruiter', 'admin'].map(r => (
            <button key={r} onClick={() => setRole(r)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${role === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner className="py-12" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">{getInitials(u.name)}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'recruiter' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBanned ? 'bg-red-100 text-red-700' : u.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.isBanned ? 'Banned' : u.isEmailVerified ? 'Active' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => handleBan(u._id, u.isBanned)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${u.isBanned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                          {u.isBanned ? <><ShieldCheck size={12} /> Unban</> : <><ShieldBan size={12} /> Ban</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
