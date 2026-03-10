import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { JOB_TYPES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const JobAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ keyword: '', location: '', skills: '', minSalary: '', jobType: '', frequency: 'daily' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/candidate/job-alerts')
      .then(({ data }) => setAlerts(data.jobAlerts))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean), minSalary: form.minSalary || undefined };
      const { data } = await api.post('/candidate/job-alerts', payload);
      setAlerts(data.jobAlerts);
      setShowForm(false);
      setForm({ keyword: '', location: '', skills: '', minSalary: '', jobType: '', frequency: 'daily' });
      toast.success('Job alert created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create alert'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (alertId) => {
    try {
      await api.delete(`/candidate/job-alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      toast.success('Alert deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Job Alerts</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16} /> Create Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Job Alert</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-600 mb-1 block">Keyword</label><input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} className={inputClass} placeholder="React Developer" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Bengaluru" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Skills (comma separated)</label><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className={inputClass} placeholder="React, Node.js" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Min Salary (₹/year)</label><input type="number" value={form.minSalary} onChange={(e) => setForm({ ...form, minSalary: e.target.value })} className={inputClass} placeholder="500000" /></div>
              <div><label className="text-xs text-gray-600 mb-1 block">Job Type</label>
                <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className={inputClass}>
                  <option value="">Any</option>{JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-600 mb-1 block">Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={inputClass}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? 'Creating...' : 'Create Alert'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <Spinner className="py-12" /> : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-indigo-200">
          <Bell size={40} className="text-indigo-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700">No job alerts yet</h3>
          <p className="text-sm text-gray-400 mt-1">Get notified when matching jobs are posted</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Create your first alert</button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${alert.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {alert.isActive ? <Bell size={16} className="text-green-600" /> : <BellOff size={16} className="text-gray-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{alert.keyword || 'Any keyword'}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {alert.location && <span className="text-xs text-gray-500">📍 {alert.location}</span>}
                    {alert.jobType && <span className="text-xs text-gray-500 capitalize">· {alert.jobType}</span>}
                    {alert.minSalary && <span className="text-xs text-gray-500">· ₹{(alert.minSalary / 100000).toFixed(1)}L+</span>}
                    {alert.frequency && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">{alert.frequency}</span>}
                  </div>
                  {alert.skills?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {alert.skills.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(alert._id)} className="text-red-400 hover:text-red-600 shrink-0 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobAlerts;
