import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { INDUSTRIES, SKILLS } from '../../utils/helpers';

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h3>
    {children}
  </div>
);

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: '', summary: '', skills: [], currentLocation: '', preferredLocations: [],
    expectedSalary: '', currentSalary: '', experienceYears: '', noticePeriod: '',
    isOpenToWork: true, githubUrl: '', linkedinUrl: '', portfolioUrl: '',
    education: [], experience: [], projects: [], certifications: [], languages: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    api.get('/candidate/profile').then(({ data }) => {
      const p = data.profile;
      if (p) setForm({ ...form, ...p, education: p.education || [], experience: p.experience || [], projects: p.projects || [], certifications: p.certifications || [], languages: p.languages || [], skills: p.skills || [], preferredLocations: p.preferredLocations || [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/candidate/profile', form);
      toast.success('Profile saved!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const addSkill = (skill) => {
    const s = skill || skillInput.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput('');
  };
  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter(x => x !== s) });

  const addExp = () => setForm({ ...form, experience: [...form.experience, { company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', skills: [] }] });
  const removeExp = (i) => setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) });
  const updateExp = (i, field, value) => {
    const arr = [...form.experience];
    arr[i] = { ...arr[i], [field]: value };
    setForm({ ...form, experience: arr });
  };

  const addEdu = () => setForm({ ...form, education: [...form.education, { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' }] });
  const removeEdu = (i) => setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) });
  const updateEdu = (i, field, value) => {
    const arr = [...form.education];
    arr[i] = { ...arr[i], [field]: value };
    setForm({ ...form, education: arr });
  };

  const addProject = () => setForm({ ...form, projects: [...form.projects, { title: '', description: '', url: '', skills: [] }] });
  const removeProject = (i) => setForm({ ...form, projects: form.projects.filter((_, idx) => idx !== i) });
  const updateProject = (i, field, value) => {
    const arr = [...form.projects];
    arr[i] = { ...arr[i], [field]: value };
    setForm({ ...form, projects: arr });
  };

  const addCert = () => setForm({ ...form, certifications: [...form.certifications, { name: '', issuer: '', issueDate: '', url: '' }] });
  const removeCert = (i) => setForm({ ...form, certifications: form.certifications.filter((_, idx) => idx !== i) });
  const updateCert = (i, field, value) => {
    const arr = [...form.certifications];
    arr[i] = { ...arr[i], [field]: value };
    setForm({ ...form, certifications: arr });
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
          <Save size={16} />{saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Basic Info */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className={labelClass}>Professional Headline</label>
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className={inputClass} placeholder="e.g. Senior React Developer" /></div>
          <div className="sm:col-span-2"><label className={labelClass}>Summary</label>
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} className={inputClass} placeholder="Brief professional summary..." /></div>
          <div><label className={labelClass}>Current Location</label>
            <input value={form.currentLocation} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })} className={inputClass} placeholder="e.g. Bengaluru" /></div>
          <div><label className={labelClass}>Notice Period</label>
            <input value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })} className={inputClass} placeholder="e.g. 30 days" /></div>
          <div><label className={labelClass}>Current Salary (LPA)</label>
            <input type="number" value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} className={inputClass} placeholder="e.g. 500000" /></div>
          <div><label className={labelClass}>Expected Salary (LPA)</label>
            <input type="number" value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} className={inputClass} placeholder="e.g. 800000" /></div>
          <div><label className={labelClass}>Years of Experience</label>
            <input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className={inputClass} /></div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="openToWork" checked={form.isOpenToWork} onChange={(e) => setForm({ ...form, isOpenToWork: e.target.checked })} className="w-4 h-4 text-indigo-600" />
            <label htmlFor="openToWork" className="text-sm text-gray-700 cursor-pointer">Open to work</label>
          </div>
        </div>
      </Section>

      {/* Social Links */}
      <Section title="Social Links">
        <div className="space-y-3">
          <div><label className={labelClass}>LinkedIn URL</label><input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className={inputClass} placeholder="https://linkedin.com/in/..." /></div>
          <div><label className={labelClass}>GitHub URL</label><input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className={inputClass} placeholder="https://github.com/..." /></div>
          <div><label className={labelClass}>Portfolio URL</label><input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} className={inputClass} placeholder="https://yourportfolio.com" /></div>
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills">
        <div className="flex flex-wrap gap-2 mb-3">
          {form.skills.map((s) => (
            <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
              {s}<button onClick={() => removeSkill(s)} className="hover:text-red-500"><Trash2 size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
            className={`flex-1 ${inputClass}`} placeholder="Type skill and press Enter" />
          <button onClick={() => addSkill()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">Add</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {SKILLS.filter(s => !form.skills.includes(s)).slice(0, 8).map((s) => (
            <button key={s} onClick={() => addSkill(s)} className="px-3 py-1 border border-gray-200 text-xs text-gray-600 rounded-lg hover:border-indigo-300 hover:text-indigo-600">+ {s}</button>
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section title="Work Experience">
        {form.experience.map((exp, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center"><p className="text-sm font-medium text-gray-700">Experience {i + 1}</p>
              <button onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Job Title *</label><input value={exp.title} onChange={(e) => updateExp(i, 'title', e.target.value)} className={inputClass} placeholder="Software Engineer" /></div>
              <div><label className={labelClass}>Company *</label><input value={exp.company} onChange={(e) => updateExp(i, 'company', e.target.value)} className={inputClass} placeholder="Company name" /></div>
              <div><label className={labelClass}>Location</label><input value={exp.location} onChange={(e) => updateExp(i, 'location', e.target.value)} className={inputClass} placeholder="City" /></div>
              <div><label className={labelClass}>Start Date</label><input type="date" value={exp.startDate?.substring(0, 10) || ''} onChange={(e) => updateExp(i, 'startDate', e.target.value)} className={inputClass} /></div>
              {!exp.isCurrent && <div><label className={labelClass}>End Date</label><input type="date" value={exp.endDate?.substring(0, 10) || ''} onChange={(e) => updateExp(i, 'endDate', e.target.value)} className={inputClass} /></div>}
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateExp(i, 'isCurrent', e.target.checked)} />
                <label className="text-sm text-gray-600">Currently working</label>
              </div>
            </div>
            <div><label className={labelClass}>Description</label><textarea value={exp.description} onChange={(e) => updateExp(i, 'description', e.target.value)} rows={2} className={inputClass} placeholder="Responsibilities, achievements..." /></div>
          </div>
        ))}
        <button onClick={addExp} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          <Plus size={16} /> Add Experience
        </button>
      </Section>

      {/* Education */}
      <Section title="Education">
        {form.education.map((edu, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between"><p className="text-sm font-medium text-gray-700">Education {i + 1}</p>
              <button onClick={() => removeEdu(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={labelClass}>Institution *</label><input value={edu.institution} onChange={(e) => updateEdu(i, 'institution', e.target.value)} className={inputClass} placeholder="University/School name" /></div>
              <div><label className={labelClass}>Degree *</label><input value={edu.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} className={inputClass} placeholder="B.Tech, MBA..." /></div>
              <div><label className={labelClass}>Field of Study</label><input value={edu.fieldOfStudy} onChange={(e) => updateEdu(i, 'fieldOfStudy', e.target.value)} className={inputClass} placeholder="Computer Science" /></div>
              <div><label className={labelClass}>Start Year</label><input type="number" value={edu.startYear} onChange={(e) => updateEdu(i, 'startYear', e.target.value)} className={inputClass} placeholder="2020" /></div>
              <div><label className={labelClass}>End Year</label><input type="number" value={edu.endYear} onChange={(e) => updateEdu(i, 'endYear', e.target.value)} className={inputClass} placeholder="2024" /></div>
              <div><label className={labelClass}>Grade/CGPA</label><input value={edu.grade} onChange={(e) => updateEdu(i, 'grade', e.target.value)} className={inputClass} placeholder="8.5 CGPA / 85%" /></div>
            </div>
          </div>
        ))}
        <button onClick={addEdu} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          <Plus size={16} /> Add Education
        </button>
      </Section>

      {/* Projects */}
      <Section title="Projects">
        {form.projects.map((p, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between"><p className="text-sm font-medium text-gray-700">Project {i + 1}</p>
              <button onClick={() => removeProject(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
            <input value={p.title} onChange={(e) => updateProject(i, 'title', e.target.value)} className={inputClass} placeholder="Project title *" />
            <textarea value={p.description} onChange={(e) => updateProject(i, 'description', e.target.value)} rows={2} className={inputClass} placeholder="Project description" />
            <input value={p.url} onChange={(e) => updateProject(i, 'url', e.target.value)} className={inputClass} placeholder="Project URL (optional)" />
            <input value={p.skills?.join(', ') || ''} onChange={(e) => updateProject(i, 'skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className={inputClass} placeholder="Skills used (comma separated)" />
          </div>
        ))}
        <button onClick={addProject} className="flex items-center gap-2 text-sm text-indigo-600 font-medium"><Plus size={16} /> Add Project</button>
      </Section>

      {/* Certifications */}
      <Section title="Certifications">
        {form.certifications.map((c, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between"><p className="text-sm font-medium text-gray-700">Certification {i + 1}</p>
              <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Name *</label><input value={c.name} onChange={(e) => updateCert(i, 'name', e.target.value)} className={inputClass} placeholder="AWS Certified..." /></div>
              <div><label className={labelClass}>Issuer</label><input value={c.issuer} onChange={(e) => updateCert(i, 'issuer', e.target.value)} className={inputClass} placeholder="Amazon, Google..." /></div>
              <div><label className={labelClass}>Issue Date</label><input type="date" value={c.issueDate?.substring(0, 10) || ''} onChange={(e) => updateCert(i, 'issueDate', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Credential URL</label><input value={c.url} onChange={(e) => updateCert(i, 'url', e.target.value)} className={inputClass} placeholder="https://..." /></div>
            </div>
          </div>
        ))}
        <button onClick={addCert} className="flex items-center gap-2 text-sm text-indigo-600 font-medium"><Plus size={16} /> Add Certification</button>
      </Section>

      {/* Save Button */}
      <div className="sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 shadow-lg">
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
