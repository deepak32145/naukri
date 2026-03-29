import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../../redux/slices/authSlice';
import api from '../../utils/axios';
import { Edit, Upload, Briefcase, GraduationCap, Code, Award, Globe, Linkedin, Github, Eye, MapPin, Phone, Mail, Download, CheckCircle2, BadgeCheck, ShieldCheck, Clock, Sparkles, X, Check } from 'lucide-react';
import ProfileCompleteness from '../../components/common/ProfileCompleteness';
import { formatDate, getInitials, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const CandidateProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [viewStats, setViewStats] = useState({ total: 0, thisWeek: 0, profileViews: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parseModal, setParseModal] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const parseInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, viewsRes] = await Promise.all([
          api.get('/candidate/profile'),
          api.get('/candidate/profile-views'),
        ]);
        setProfile(profileRes.data.profile);
        setViewStats({
          total: viewsRes.data.total || 0,
          thisWeek: viewsRes.data.thisWeek || 0,
          profileViews: viewsRes.data.profileViews || [],
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleRequestVerification = async () => {
    try {
      await api.post('/candidate/verify');
      setProfile(p => ({ ...p, verificationStatus: 'pending' }));
      toast.success('Verification request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request verification');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      await api.put('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(fetchMe());
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Failed to update photo');
    } finally { setUploading(false); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const { data } = await api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, resume: data.resume, completenessScore: data.completenessScore }));
      toast.success('Resume uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    } finally { setUploading(false); }
  };

  const handleParseResume = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    setParsing(true);
    setParsedData(null);
    try {
      const { data } = await api.post('/candidate/resume/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setParsedData(data.parsed);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse resume');
      setParseModal(false);
    } finally {
      setParsing(false);
      if (parseInputRef.current) parseInputRef.current.value = '';
    }
  };

  const handleImportParsed = async () => {
    if (!parsedData) return;
    setImporting(true);
    try {
      const { data } = await api.post('/candidate/profile/import', parsedData);
      setProfile(data.profile);
      setParseModal(false);
      setParsedData(null);
      toast.success('Profile updated from resume!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import profile');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">{getInitials(user?.name)}</div>
              )}
              <label className={`absolute bottom-0 right-0 bg-white border-2 border-indigo-100 rounded-full p-1.5 cursor-pointer hover:bg-indigo-50 ${uploading ? 'opacity-50' : ''}`}>
                <Upload size={14} className="text-indigo-600" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
            <p className="text-indigo-600 text-sm mt-0.5">{profile?.headline || 'Add a headline'}</p>
            {user?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1"><CheckCircle2 size={12} />Email Verified</span>
            ) : null}
            {profile?.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-1 font-semibold"><BadgeCheck size={13} />Identity Verified</span>
            )}
            {profile?.verificationStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-600 mt-1"><Clock size={12} />Verification Pending</span>
            )}
            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
              {user?.email && <p className="flex items-center justify-center gap-1"><Mail size={12} />{user.email}</p>}
              {user?.phone && <p className="flex items-center justify-center gap-1"><Phone size={12} />{user.phone}</p>}
              {profile?.currentLocation && <p className="flex items-center justify-center gap-1"><MapPin size={12} />{profile.currentLocation}</p>}
            </div>
            <div className="flex justify-center gap-3 mt-3">
              {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:opacity-70"><Linkedin size={18} /></a>}
              {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-gray-700 hover:opacity-70"><Github size={18} /></a>}
              {profile?.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:opacity-70"><Globe size={18} /></a>}
            </div>
            <Link to="/profile/edit" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100">
              <Edit size={14} /> Edit Profile
            </Link>
            <Link to="/resume-builder" className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Download size={14} /> Build Resume PDF
            </Link>
            {profile?.verificationStatus === 'none' && (
              <button onClick={handleRequestVerification}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50">
                <ShieldCheck size={14} /> Request Verification
              </button>
            )}
          </div>

          {/* Profile Completeness */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col items-center">
            <ProfileCompleteness score={profile?.completenessScore || 0} />
            {(profile?.completenessScore || 0) < 80 && (
              <Link to="/profile/edit" className="mt-3 text-xs text-indigo-600 hover:underline">Improve your profile →</Link>
            )}
          </div>

          {/* Resume */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
            {profile?.resume?.url ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 line-clamp-1">{profile.resume.name}</p>
                <p className="text-xs text-gray-400">{timeAgo(profile.resume.uploadedAt)}</p>
                <div className="flex gap-2">
                  <a href={profile.resume.url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100">
                    <Download size={12} /> View
                  </a>
                  <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}>
                    <Upload size={12} /> Update
                    <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 p-4 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 ${uploading ? 'opacity-50' : ''}`}>
                <Upload size={20} className="text-indigo-400" />
                <p className="text-xs text-gray-500 text-center">Upload resume (PDF, max 5MB)</p>
                <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
              </label>
            )}
            <button onClick={() => { setParsedData(null); setParseModal(true); }}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 bg-linear-to-r from-violet-500 to-indigo-500 text-white rounded-xl text-xs font-semibold hover:opacity-90">
              <Sparkles size={13} /> Parse Resume with AI
            </button>
          </div>

          {/* Profile Views Summary (sidebar) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Profile Views</h3>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 text-center bg-indigo-50 rounded-xl py-3">
                <p className="text-2xl font-bold text-indigo-600">{viewStats.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="flex-1 text-center bg-green-50 rounded-xl py-3">
                <p className="text-2xl font-bold text-green-600">{viewStats.thisWeek}</p>
                <p className="text-xs text-gray-500 mt-0.5">This week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          {profile?.summary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
            </div>
          )}

          {/* Skills */}
          {profile?.skills?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile?.experience?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><Briefcase size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">Experience</h3></div>
              <div className="space-y-4">
                {profile.experience.map((exp, i) => (
                  <div key={i} className={`pl-4 ${i < profile.experience.length - 1 ? 'border-b pb-4' : ''}`}>
                    <p className="font-semibold text-gray-900">{exp.title}</p>
                    <p className="text-indigo-600 text-sm">{exp.company}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {exp.startDate ? formatDate(exp.startDate, 'MMM yyyy') : ''} – {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate, 'MMM yyyy') : ''}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    {exp.description && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile?.education?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><GraduationCap size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">Education</h3></div>
              <div className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className={`pl-4 ${i < profile.education.length - 1 ? 'border-b pb-4' : ''}`}>
                    <p className="font-semibold text-gray-900">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>
                    <p className="text-indigo-600 text-sm">{edu.institution}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{edu.startYear} – {edu.isCurrentlyStudying ? 'Present' : edu.endYear}</p>
                    {edu.grade && <p className="text-xs text-gray-500 mt-0.5">Grade: {edu.grade}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile?.projects?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><Code size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">Projects</h3></div>
              <div className="space-y-4">
                {profile.projects.map((p, i) => (
                  <div key={i} className={`pl-4 ${i < profile.projects.length - 1 ? 'border-b pb-4' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{p.title}</p>
                      {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs hover:underline">View →</a>}
                    </div>
                    {p.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.description}</p>}
                    {p.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.skills.map((s) => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile?.certifications?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><Award size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">Certifications</h3></div>
              <div className="space-y-3">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{cert.name}</p>
                      <p className="text-xs text-gray-500">{cert.issuer} {cert.issueDate ? `· ${formatDate(cert.issueDate, 'MMM yyyy')}` : ''}</p>
                    </div>
                    {cert.url && <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Verify</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Views Detail */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Who Viewed Your Profile</h3>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-medium">{viewStats.total} total</span>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-medium">{viewStats.thisWeek} this week</span>
              </div>
            </div>
            {viewStats.profileViews.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Eye size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No views yet</p>
                <p className="text-xs text-gray-400 mt-1">Recruiters who view your profile will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {viewStats.profileViews.slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                      {v.viewedBy?.avatar?.url
                        ? <img src={v.viewedBy.avatar.url} alt={v.viewedBy.name} className="w-9 h-9 rounded-full object-cover" />
                        : getInitials(v.viewedBy?.name || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{v.viewedBy?.name || 'A recruiter'}</p>
                      <p className="text-xs text-gray-400 capitalize">{v.viewedBy?.role || 'recruiter'}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{timeAgo(v.viewedAt)}</p>
                  </div>
                ))}
                {viewStats.profileViews.length > 10 && (
                  <p className="text-xs text-center text-gray-400 pt-3">+{viewStats.profileViews.length - 10} more views</p>
                )}
              </div>
            )}
          </div>

          {(!profile?.summary && !profile?.experience?.length && !profile?.education?.length) && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">👤</p>
              <h3 className="font-semibold text-gray-700">Your profile is empty</h3>
              <p className="text-sm text-gray-400 mt-1">Add your experience, education, skills and more</p>
              <Link to="/profile/edit" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                <Edit size={14} /> Complete Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AI Resume Parse Modal */}
      {parseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-violet-500" />
                <h2 className="font-semibold text-gray-900">Parse Resume with AI</h2>
              </div>
              <button onClick={() => { setParseModal(false); setParsedData(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Upload area */}
              {!parsedData && !parsing && (
                <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-violet-200 rounded-xl cursor-pointer hover:bg-violet-50">
                  <Sparkles size={28} className="text-violet-400" />
                  <div className="text-center">
                    <p className="font-medium text-gray-700">Upload your resume PDF</p>
                    <p className="text-xs text-gray-400 mt-1">Claude AI will extract your experience, skills, education and more</p>
                  </div>
                  <input ref={parseInputRef} type="file" accept="application/pdf" onChange={handleParseResume} className="hidden" />
                </label>
              )}

              {/* Parsing spinner */}
              {parsing && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Analyzing your resume with AI…</p>
                </div>
              )}

              {/* Parsed preview */}
              {parsedData && (
                <div className="space-y-4 text-sm">
                  <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Review the extracted data below. Clicking "Import to Profile" will overwrite the matching fields.
                  </p>

                  {parsedData.headline && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Headline</p>
                    <p className="text-gray-800">{parsedData.headline}</p></div>
                  )}

                  {parsedData.summary && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-gray-600 text-xs leading-relaxed">{parsedData.summary}</p></div>
                  )}

                  {parsedData.skills?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.map(s => <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{s}</span>)}
                    </div></div>
                  )}

                  {parsedData.experience?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience ({parsedData.experience.length})</p>
                    <div className="space-y-2">
                      {parsedData.experience.map((e, i) => (
                        <div key={i} className="border-l-2 border-indigo-200 pl-3">
                          <p className="font-medium text-gray-800">{e.title} — {e.company}</p>
                          <p className="text-xs text-gray-400">{e.startDate?.slice(0, 7)} – {e.isCurrent ? 'Present' : e.endDate?.slice(0, 7)}</p>
                        </div>
                      ))}
                    </div></div>
                  )}

                  {parsedData.education?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education ({parsedData.education.length})</p>
                    <div className="space-y-2">
                      {parsedData.education.map((e, i) => (
                        <div key={i} className="border-l-2 border-green-200 pl-3">
                          <p className="font-medium text-gray-800">{e.degree}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''}</p>
                          <p className="text-xs text-gray-400">{e.institution} · {e.startYear} – {e.isCurrentlyStudying ? 'Present' : e.endYear}</p>
                        </div>
                      ))}
                    </div></div>
                  )}

                  {parsedData.projects?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Projects ({parsedData.projects.length})</p>
                    <p className="text-xs text-gray-500">{parsedData.projects.map(p => p.title).join(', ')}</p></div>
                  )}

                  {parsedData.certifications?.length > 0 && (
                    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Certifications ({parsedData.certifications.length})</p>
                    <p className="text-xs text-gray-500">{parsedData.certifications.map(c => c.name).join(', ')}</p></div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {parsedData && (
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <label className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm cursor-pointer hover:bg-gray-50">
                  <Upload size={14} /> Try another file
                  <input ref={parseInputRef} type="file" accept="application/pdf" onChange={handleParseResume} className="hidden" />
                </label>
                <button onClick={handleImportParsed} disabled={importing}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  <Check size={14} /> {importing ? 'Importing…' : 'Import to Profile'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
