import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { Search, Trash2 } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/jobs', { params: { search, status, limit: 30 } });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [status]);

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this job permanently?')) return;
    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success('Job removed');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">All Jobs <span className="text-gray-400 font-normal text-base">({total})</span></h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            className="flex-1 py-2.5 text-sm outline-none" placeholder="Search by job title" />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'paused', 'closed', 'draft'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Posted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map(j => (
                  <tr key={j._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{j.title}</p>
                      <p className="text-xs text-gray-400">{j.location} · {j.jobType}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{j.companyId?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(j.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(j._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                        <Trash2 size={12} /> Remove
                      </button>
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

export default AdminJobs;
