import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { INDUSTRIES, JOB_TYPES, SKILLS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', skills: [], salaryMin: '', salaryMax: '',
    location: '', isRemote: false, jobType: 'full-time', experienceMin: 0, experienceMax: 5,
    industry: '', openings: 1, status: 'active', deadline: '', isFeatured: false,
  });

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  const addSkill = (skill) => {
    const s = skill || skillInput.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location) { toast.error('Title, description and location are required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/jobs', { ...form, salaryMin: form.salaryMin || undefined, salaryMax: form.salaryMax || undefined });
      toast.success('Job posted successfully!');
      navigate(`/recruiter/jobs/${data.job._id}/applicants`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-xl"><Briefcase size={20} className="text-indigo-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-sm text-gray-500">Fill in the details to attract the right candidates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 pb-2 border-b">Job Details</h2>
          <div>
            <label className={labelClass}>Job Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClass} placeholder="e.g. Senior React Developer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Location *</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className={inputClass} placeholder="e.g. Bengaluru, Karnataka" />
            </div>
            <div>
              <label className={labelClass}>Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass}>
                <option value="">Select industry</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Job Type</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className={inputClass}>
                {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Openings</label>
              <input type="number" min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) || 1 })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Min Experience (years)</label>
              <input type="number" min={0} value={form.experienceMin} onChange={(e) => setForm({ ...form, experienceMin: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max Experience (years)</label>
              <input type="number" min={0} value={form.experienceMax} onChange={(e) => setForm({ ...form, experienceMax: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Min Salary (₹/year)</label>
              <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className={inputClass} placeholder="e.g. 500000" />
            </div>
            <div>
              <label className={labelClass}>Max Salary (₹/year)</label>
              <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className={inputClass} placeholder="e.g. 1200000" />
            </div>
            <div>
              <label className={labelClass}>Application Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="active">Active (Publish Now)</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">Remote OK</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">Featured Job</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 pb-2 border-b">Job Description</h2>
          <div>
            <label className={labelClass}>Job Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={8} className={inputClass} placeholder="Describe the role, responsibilities, day-to-day tasks..." />
          </div>
          <div>
            <label className={labelClass}>Requirements & Qualifications</label>
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={5} className={inputClass} placeholder="Required qualifications, experience, education..." />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 pb-2 border-b mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map((s) => (
              <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                {s}<button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })} className="hover:text-red-500"><Trash2 size={11} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-3">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
              className={`flex-1 ${inputClass}`} placeholder="Add skill and press Enter" />
            <button type="button" onClick={() => addSkill()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILLS.filter(s => !form.skills.includes(s)).slice(0, 10).map((s) => (
              <button key={s} type="button" onClick={() => addSkill(s)} className="px-2.5 py-1 border border-gray-200 text-xs text-gray-600 rounded-lg hover:border-indigo-300 hover:text-indigo-600">+ {s}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 text-sm">
            {loading ? 'Posting...' : form.status === 'draft' ? 'Save as Draft' : 'Post Job'}
          </button>
          <button type="button" onClick={() => navigate('/recruiter/jobs')} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
