import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/axios';
import { Download, MessageSquare, Calendar, ChevronDown, Search, CheckSquare, Square, Zap } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { timeAgo, getInitials, formatDate } from '../../utils/helpers';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['under_review', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'];

const InterviewModal = ({ app, onClose, onSchedule }) => {
  const [form, setForm] = useState({ date: '', time: '', mode: 'online', link: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSchedule(app._id, form);
    setLoading(false);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-bold text-gray-900 mb-4">Schedule Interview</h2>
        <p className="text-sm text-gray-500 mb-4">for {app.candidateId?.name}</p>
        <form onSubmit={handle} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-600 mb-1 block">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="text-xs text-gray-600 mb-1 block">Time *</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="text-xs text-gray-600 mb-1 block">Mode</label>
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="online">Online</option><option value="offline">In-Person</option><option value="phone">Phone</option>
            </select></div>
          {form.mode === 'online' && <div><label className="text-xs text-gray-600 mb-1 block">Meeting Link</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://meet.google.com/..." /></div>}
          <div><label className="text-xs text-gray-600 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{loading ? 'Scheduling...' : 'Schedule'}</button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Applicants = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [interviewModal, setInterviewModal] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('shortlisted');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          api.get(`/applications/jobs/${jobId}/applications`),
          api.get(`/jobs/${jobId}`),
        ]);
        setApplications(appsRes.data.applications);
        setJob(jobsRes.data.job);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [jobId]);

  const handleStatusChange = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
    } catch { toast.error('Failed to update'); }
  };

  const handleSchedule = async (appId, interviewData) => {
    try {
      await api.put(`/applications/${appId}/interview`, interviewData);
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: 'interview_scheduled', interviewDetails: interviewData } : a));
      toast.success('Interview scheduled!');
    } catch { toast.error('Failed to schedule'); }
  };

  const filtered = applications.filter(app => {
    const matchStatus = filter === 'all' || app.status === filter;
    const matchSearch = !search || app.candidateId?.name?.toLowerCase().includes(search.toLowerCase()) || app.candidateId?.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a._id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await api.put('/applications/bulk-status', { applicationIds: [...selected], status: bulkStatus });
      setApplications(prev => prev.map(a => selected.has(a._id) ? { ...a, status: bulkStatus } : a));
      setSelected(new Set());
      toast.success(`${selected.size} application(s) moved to ${bulkStatus.replace(/_/g, ' ')}`);
    } catch { toast.error('Bulk update failed'); }
    finally { setBulkLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link to="/recruiter/jobs" className="text-sm text-indigo-600 hover:underline">← Back to jobs</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">{job?.title} — Applicants</h1>
        <p className="text-sm text-gray-500 mt-0.5">{applications.length} total applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-xl px-3">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 py-2.5 text-sm outline-none" placeholder="Search applicants..." />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'applied', 'under_review', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? `All (${applications.length})` : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-indigo-600">
            {selected.size === filtered.length && filtered.length > 0
              ? <CheckSquare size={15} className="text-indigo-600" />
              : <Square size={15} />}
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </button>
          {selected.size > 0 && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2 flex-1">
                <Zap size={14} className="text-indigo-500 shrink-0" />
                <span className="text-xs text-gray-600 shrink-0">Move to</span>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <button onClick={handleBulkUpdate} disabled={bulkLoading}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-60 hover:bg-indigo-700">
                  {bulkLoading ? 'Updating...' : 'Apply'}
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {loading ? <Spinner className="py-12" /> : filtered.length === 0 ? (
        <div className="text-center py-16"><p className="text-4xl mb-3">👤</p><p className="text-gray-500">No applicants found</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${selected.has(app._id) ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(app._id)} className="shrink-0 text-gray-400 hover:text-indigo-600">
                      {selected.has(app._id)
                        ? <CheckSquare size={18} className="text-indigo-600" />
                        : <Square size={18} />}
                    </button>
                    {app.candidateId?.avatar?.url ? (
                      <img src={app.candidateId.avatar.url} alt={app.candidateId.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{getInitials(app.candidateId?.name)}</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{app.candidateId?.name}</p>
                      <p className="text-sm text-gray-500">{app.candidateId?.email}</p>
                      {app.candidateProfile?.headline && <p className="text-xs text-indigo-600 mt-0.5">{app.candidateProfile.headline}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {app.referredBy?.name && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                        Referred by {app.referredBy.name}
                      </span>
                    )}
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-gray-400">{timeAgo(app.createdAt)}</span>
                    <button onClick={() => setExpandedApp(expandedApp === app._id ? null : app._id)} className="p-1 text-gray-400 hover:text-gray-600">
                      <ChevronDown size={16} className={expandedApp === app._id ? 'rotate-180' : ''} />
                    </button>
                  </div>
                </div>

                {app.candidateProfile && (
                  <div className="flex flex-wrap gap-3 mt-3 ml-9">
                    {app.candidateProfile.experienceYears !== undefined && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{app.candidateProfile.experienceYears} yrs exp</span>
                    )}
                    {app.candidateProfile.skills?.slice(0, 4).map(s => (
                      <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{s}</span>
                    ))}
                    {app.candidateProfile.currentLocation && (
                      <span className="text-xs text-gray-500">📍 {app.candidateProfile.currentLocation}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 ml-9">
                  <select value={app.status} onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="applied">Applied</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button onClick={() => setInterviewModal(app)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100">
                    <Calendar size={12} /> Schedule Interview
                  </button>
                  {app.resume?.url && (
                    <a href={app.resume.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                      <Download size={12} /> Resume
                    </a>
                  )}
                  <Link to="/chat" state={{ startChatWith: app.candidateId?._id }} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                    <MessageSquare size={12} /> Chat
                  </Link>
                </div>
              </div>

              {expandedApp === app._id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50">
                  {app.coverLetter && (
                    <div><p className="text-xs font-semibold text-gray-700 mb-1">Cover Letter</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{app.coverLetter}</p></div>
                  )}
                  {app.timeline?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-700 mb-2">Timeline</p>
                      <div className="space-y-1.5">
                        {app.timeline.map((t, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            <p className="text-xs text-gray-600 capitalize">{t.status.replace(/_/g, ' ')}{t.note ? ` — ${t.note}` : ''} <span className="text-gray-400">({timeAgo(t.updatedAt)})</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.interviewDetails?.date && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-700 mb-1">Interview Details</p>
                      <p className="text-xs text-indigo-600">{formatDate(app.interviewDetails.date)} at {app.interviewDetails.time} · {app.interviewDetails.mode}</p>
                      {app.interviewDetails.link && <a href={app.interviewDetails.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 underline">Join Link</a>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {interviewModal && (
        <InterviewModal app={interviewModal} onClose={() => setInterviewModal(null)} onSchedule={handleSchedule} />
      )}
    </div>
  );
};

export default Applicants;
