import { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { Upload, Building2, Save } from 'lucide-react';
import { INDUSTRIES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const CompanySetup = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', industry: '', size: '', website: '', location: '', founded: '', linkedIn: '' });

  useEffect(() => {
    api.get('/companies/my').then(({ data }) => {
      if (data.company) { setCompany(data.company); setForm({ ...data.company }); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      if (company) {
        const { data } = await api.put(`/companies/${company._id}`, form);
        setCompany(data.company);
      } else {
        const { data } = await api.post('/companies', form);
        setCompany(data.company);
      }
      toast.success('Company profile saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    if (!company) { toast.error('Save company details first'); return; }
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    setLogoUploading(true);
    try {
      const { data } = await api.post(`/companies/${company._id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCompany(prev => ({ ...prev, logo: data.logo }));
      toast.success('Logo uploaded!');
    } catch { toast.error('Failed to upload logo'); }
    finally { setLogoUploading(false); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-xl"><Building2 size={20} className="text-indigo-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{company ? 'Edit Company Profile' : 'Setup Company Profile'}</h1>
          <p className="text-sm text-gray-500">This information will appear on all your job postings</p>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-gray-900 mb-4">Company Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
            {company?.logo?.url ? (
              <img src={company.logo.url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={24} className="text-gray-300" />
            )}
          </div>
          <label className={`flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 ${logoUploading ? 'opacity-50' : ''}`}>
            <Upload size={14} className="text-gray-500" />
            {logoUploading ? 'Uploading...' : 'Upload Logo'}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={logoUploading} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 pb-2 border-b">Company Details</h3>
        <div>
          <label className={labelClass}>Company Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Acme Corp" />
        </div>
        <div>
          <label className={labelClass}>About the Company</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} placeholder="Describe your company, culture, mission..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Industry</label>
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputClass}>
              <option value="">Select industry</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Company Size</label>
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputClass}>
              <option value="">Select size</option>
              {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Headquarters</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="City, State" />
          </div>
          <div>
            <label className={labelClass}>Founded Year</label>
            <input type="number" value={form.founded} onChange={(e) => setForm({ ...form, founded: e.target.value })} className={inputClass} placeholder="e.g. 2010" />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://company.com" />
          </div>
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            <input value={form.linkedIn} onChange={(e) => setForm({ ...form, linkedIn: e.target.value })} className={inputClass} placeholder="https://linkedin.com/company/..." />
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
          <Save size={16} />{saving ? 'Saving...' : company ? 'Update Company' : 'Create Company Profile'}
        </button>
      </form>
    </div>
  );
};

export default CompanySetup;
