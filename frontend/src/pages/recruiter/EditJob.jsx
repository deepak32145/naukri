import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { INDUSTRIES, JOB_TYPES, SKILLS } from '../../utils/helpers';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', skills: [], salaryMin: '', salaryMax: '',
    location: '', isRemote: false, jobType: 'full-time', experienceMin: 0, experienceMax: 5,
    industry: '', openings: 1, status: 'active', deadline: '', isFeatured: false,
  });

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => {
      const job = data.job;
      setForm({ ...job, salaryMin: job.salaryMin || '', salaryMax: job.salaryMax || '', deadline: job.deadline?.substring(0, 10) || '' });
      setLoading(false);
    }).catch(() => { toast.error('Failed to load job'); navigate('/recruiter/jobs'); });
  }, [id]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/jobs/${id}`, { ...form, salaryMin: form.salaryMin || undefined, salaryMax: form.salaryMax || undefined });
      toast.success('Job updated!');
      navigate('/recruiter/jobs');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Edit Job</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 pb-2 border-b">Job Details</h2>
          <div><label className={labelClass}>Job Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Location *</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className={inputClass} /></div>
            <div><label className={labelClass}>Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass}>
                <option value="">Select</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
            <div><label className={labelClass}>Job Type</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className={inputClass}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className={labelClass}>Openings</label><input type="number" min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) || 1 })} className={inputClass} /></div>
            <div><label className={labelClass}>Min Exp (yrs)</label><input type="number" min={0} value={form.experienceMin} onChange={(e) => setForm({ ...form, experienceMin: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
            <div><label className={labelClass}>Max Exp (yrs)</label><input type="number" min={0} value={form.experienceMax} onChange={(e) => setForm({ ...form, experienceMax: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
            <div><label className={labelClass}>Min Salary (₹)</label><input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Max Salary (₹)</label><input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option><option value="draft">Draft</option></select></div>
            <div><label className={labelClass}>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} /><span className="text-sm text-gray-700">Remote OK</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /><span className="text-sm text-gray-700">Featured</span></label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 pb-2 border-b">Description</h2>
          <div><label className={labelClass}>Job Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={8} className={inputClass} /></div>
          <div><label className={labelClass}>Requirements</label>
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={5} className={inputClass} /></div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 pb-2 border-b mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map(s => (
              <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                {s}<button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })} className="hover:text-red-500"><Trash2 size={11} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
              className={`flex-1 ${inputClass}`} placeholder="Add skill" />
            <button type="button" onClick={addSkill} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">Add</button>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Updating...' : 'Update Job'}
          </button>
          <button type="button" onClick={() => navigate('/recruiter/jobs')} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditJob;
