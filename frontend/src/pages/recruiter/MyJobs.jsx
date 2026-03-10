import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyJobs } from '../../redux/slices/jobsSlice';
import api from '../../utils/axios';
import { Plus, Users, Eye, Edit, Trash2, MoreVertical, Play, Pause, X } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo } from '../../utils/helpers';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const MyJobs = () => {
  const dispatch = useDispatch();
  const { myJobs, loading } = useSelector((s) => s.jobs);
  const [jobs, setJobs] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    dispatch(fetchMyJobs());
  }, [dispatch]);

  useEffect(() => { setJobs(myJobs); }, [myJobs]);

  const handleStatusChange = async (jobId, status) => {
    try {
      await api.put(`/jobs/${jobId}/status`, { status });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status } : j));
      toast.success(`Job ${status}`);
    } catch (err) { toast.error('Failed to update status'); }
    setOpenMenu(null);
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success('Job deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const activeCount = jobs.filter(j => j.status === 'active').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeCount} active · {jobs.length} total</p>
        </div>
        <Link to="/recruiter/post-job" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {loading ? <Spinner className="py-12" /> : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-indigo-200">
          <p className="text-5xl mb-3">📋</p>
          <h3 className="font-semibold text-gray-700">No jobs posted yet</h3>
          <Link to="/recruiter/post-job" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            <Plus size={14} /> Post your first job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <StatusBadge status={job.status} />
                    {job.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{job.location} · {job.jobType} · {job.experienceMin}-{job.experienceMax} yrs</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm text-gray-600"><Users size={14} />{job.applicationsCount || 0} applicants</span>
                    <span className="flex items-center gap-1 text-sm text-gray-400"><Eye size={14} />{job.viewsCount || 0} views</span>
                    <span className="text-xs text-gray-400">{timeAgo(job.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/recruiter/jobs/${job._id}/applicants`} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 flex items-center gap-1">
                    <Users size={12} /> Applicants
                  </Link>
                  <Link to={`/recruiter/jobs/${job._id}/edit`} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                    <Edit size={14} />
                  </Link>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === job._id ? null : job._id)} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                      <MoreVertical size={14} />
                    </button>
                    {openMenu === job._id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-10 py-1">
                        {job.status !== 'active' && (
                          <button onClick={() => handleStatusChange(job._id, 'active')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50">
                            <Play size={13} /> Activate
                          </button>
                        )}
                        {job.status === 'active' && (
                          <button onClick={() => handleStatusChange(job._id, 'paused')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50">
                            <Pause size={13} /> Pause
                          </button>
                        )}
                        {job.status !== 'closed' && (
                          <button onClick={() => handleStatusChange(job._id, 'closed')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            <X size={13} /> Close
                          </button>
                        )}
                        <button onClick={() => handleDelete(job._id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;
