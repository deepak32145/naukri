import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../../redux/slices/authSlice';
import api from '../../utils/axios';
import { Edit, Upload, Briefcase, GraduationCap, Code, Award, Globe, Linkedin, Github, Eye, MapPin, Phone, Mail, Download, CheckCircle2 } from 'lucide-react';
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
              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1"><CheckCircle2 size={12} />Verified</span>
            ) : null}
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
    </div>
  );
};

export default CandidateProfile;
