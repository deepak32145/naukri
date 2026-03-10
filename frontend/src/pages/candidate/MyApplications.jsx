import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../utils/axios';
import { Building2, MapPin, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { timeAgo, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ApplicationCard = ({ app, onWithdraw }) => {
  const [expanded, setExpanded] = useState(false);
  const job = app.jobId;
  const company = job?.companyId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            {company?.logo?.url ? (
              <img src={company.logo.url} alt={company.name} className="w-12 h-12 rounded-lg object-cover border" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center"><Building2 size={18} className="text-indigo-600" /></div>
            )}
            <div>
              <Link to={`/jobs/${job?._id}`} className="font-semibold text-gray-900 hover:text-indigo-600">{job?.title}</Link>
              <p className="text-sm text-gray-500">{company?.name}</p>
              <div className="flex items-center gap-3 mt-1">
                {job?.location && <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{job.location}</span>}
                <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} />{timeAgo(app.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={app.status} />
            {app.status === 'applied' && (
              <button onClick={() => onWithdraw(app._id)} className="text-red-400 hover:text-red-600 p-1 rounded" title="Withdraw application"><X size={16} /></button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {/* Timeline */}
            {app.timeline?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Timeline</p>
                <div className="space-y-2">
                  {app.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700 capitalize">{t.status.replace(/_/g, ' ')}</p>
                        {t.note && <p className="text-xs text-gray-400">{t.note}</p>}
                        <p className="text-xs text-gray-300">{timeAgo(t.updatedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Details */}
            {app.status === 'interview_scheduled' && app.interviewDetails?.date && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-700 mb-1">Interview Scheduled</p>
                <p className="text-xs text-indigo-600">Date: {formatDate(app.interviewDetails.date)}</p>
                {app.interviewDetails.time && <p className="text-xs text-indigo-600">Time: {app.interviewDetails.time}</p>}
                {app.interviewDetails.mode && <p className="text-xs text-indigo-600 capitalize">Mode: {app.interviewDetails.mode}</p>}
                {app.interviewDetails.link && (
                  <a href={app.interviewDetails.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 underline">Join Link</a>
                )}
              </div>
            )}

            {/* Cover Letter */}
            {app.coverLetter && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Your Cover Letter</p>
                <p className="text-xs text-gray-500 leading-relaxed">{app.coverLetter}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/applications/my-applications')
      .then(({ data }) => setApplications(data.applications))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      toast.success('Application withdrawn');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const statuses = ['all', 'applied', 'under_review', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'];
  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">My Applications <span className="text-gray-400 text-base font-normal">({applications.length})</span></h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? `All (${applications.length})` : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <Spinner className="py-12" /> : (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📋</p>
              <h3 className="font-semibold text-gray-700">No applications {filter !== 'all' ? `with status "${filter.replace(/_/g, ' ')}"` : 'yet'}</h3>
              {filter === 'all' && <Link to="/jobs" className="mt-4 inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Browse Jobs</Link>}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => <ApplicationCard key={app._id} app={app} onWithdraw={handleWithdraw} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyApplications;
