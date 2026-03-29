import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import { Building2, MapPin, Clock, ChevronDown, ChevronUp, X, LayoutList, Columns } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { timeAgo, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const KANBAN_COLUMNS = [
  { key: 'applied', label: 'Applied', color: 'border-gray-300 bg-gray-50', dot: 'bg-gray-400' },
  { key: 'under_review', label: 'Under Review', color: 'border-blue-300 bg-blue-50', dot: 'bg-blue-400' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'border-indigo-300 bg-indigo-50', dot: 'bg-indigo-500' },
  { key: 'interview_scheduled', label: 'Interview', color: 'border-yellow-300 bg-yellow-50', dot: 'bg-yellow-400' },
  { key: 'hired', label: 'Hired', color: 'border-green-300 bg-green-50', dot: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', color: 'border-red-300 bg-red-50', dot: 'bg-red-400' },
];

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
            {app.status === 'interview_scheduled' && app.interviewDetails?.date && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-700 mb-1">Interview Scheduled</p>
                <p className="text-xs text-indigo-600">Date: {formatDate(app.interviewDetails.date)}</p>
                {app.interviewDetails.time && <p className="text-xs text-indigo-600">Time: {app.interviewDetails.time}</p>}
                {app.interviewDetails.mode && <p className="text-xs text-indigo-600 capitalize">Mode: {app.interviewDetails.mode}</p>}
                {app.interviewDetails.link && <a href={app.interviewDetails.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 underline">Join Link</a>}
              </div>
            )}
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

// Compact card for Kanban columns
const KanbanCard = ({ app, onWithdraw }) => {
  const job = app.jobId;
  const company = job?.companyId;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 group">
      <div className="flex items-start gap-2">
        {company?.logo?.url ? (
          <img src={company.logo.url} alt={company.name} className="w-8 h-8 rounded-lg object-cover border shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><Building2 size={12} className="text-indigo-600" /></div>
        )}
        <div className="min-w-0">
          <Link to={`/jobs/${job?._id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 line-clamp-1">{job?.title}</Link>
          <p className="text-xs text-gray-500 truncate">{company?.name}</p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(app.createdAt)}</p>
        </div>
        {app.status === 'applied' && (
          <button onClick={() => onWithdraw(app._id)} className="shrink-0 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
            <X size={13} />
          </button>
        )}
      </div>
      {app.status === 'interview_scheduled' && app.interviewDetails?.date && (
        <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2 py-1">
          📅 {formatDate(app.interviewDetails.date)}
        </div>
      )}
    </div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list'); // 'list' | 'kanban'

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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          My Applications <span className="text-gray-400 text-base font-normal">({applications.length})</span>
        </h1>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setView('list')} title="List view"
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutList size={16} />
          </button>
          <button onClick={() => setView('kanban')} title="Kanban view"
            className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Columns size={16} />
          </button>
        </div>
      </div>

      {/* Filter tabs — only shown in list view */}
      {view === 'list' && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? `All (${applications.length})` : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {loading ? <Spinner className="py-12" /> : (
        <>
          {/* ── List View ── */}
          {view === 'list' && (
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">📋</p>
                  <h3 className="font-semibold text-gray-700">No applications {filter !== 'all' ? `with status "${filter.replace(/_/g, ' ')}"` : 'yet'}</h3>
                  {filter === 'all' && <Link to="/jobs" className="mt-4 inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Browse Jobs</Link>}
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {filtered.map((app) => <ApplicationCard key={app._id} app={app} onWithdraw={handleWithdraw} />)}
                </div>
              )}
            </>
          )}

          {/* ── Kanban View ── */}
          {view === 'kanban' && (
            <>
              {applications.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">📋</p>
                  <h3 className="font-semibold text-gray-700">No applications yet</h3>
                  <Link to="/jobs" className="mt-4 inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Browse Jobs</Link>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {KANBAN_COLUMNS.map(({ key, label, color, dot }) => {
                    const colApps = applications.filter(a => a.status === key);
                    return (
                      <div key={key} className={`shrink-0 w-64 rounded-2xl border-2 ${color} p-3`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                          <span className="text-sm font-semibold text-gray-700">{label}</span>
                          <span className="ml-auto text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{colApps.length}</span>
                        </div>
                        <div className="space-y-2 min-h-15">
                          {colApps.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">—</p>
                          ) : (
                            colApps.map(app => <KanbanCard key={app._id} app={app} onWithdraw={handleWithdraw} />)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyApplications;
