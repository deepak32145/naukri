import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/axios';
import { MapPin, Briefcase, GraduationCap, Code, Award, Globe, Linkedin, Github, Eye, Phone, Mail, Download, CheckCircle2, BadgeCheck, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { formatDate, getInitials, timeAgo } from '../../utils/helpers';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <Spinner className="py-12" />;

  if (!user) return <div className="text-center py-16"><p className="text-gray-500">User not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {user.avatar?.url ? (
            <img src={user.avatar.url} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
              {getInitials(user.name)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
            </div>
            {profile?.headline && <p className="text-lg text-indigo-600 mb-2">{profile.headline}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {profile?.currentLocation && <span className="flex items-center gap-1"><MapPin size={14} />{profile.currentLocation}</span>}
              {profile?.experienceYears !== undefined && <span className="flex items-center gap-1"><Briefcase size={14} />{profile.experienceYears} years experience</span>}
              {user.email && <span className="flex items-center gap-1"><Mail size={14} />{user.email}</span>}
              {user.phone && <span className="flex items-center gap-1"><Phone size={14} />{user.phone}</span>}
            </div>
          </div>
        </div>

        {/* About */}
        {profile?.about && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700">{profile.about}</p>
          </div>
        )}

        {/* Skills */}
        {profile?.skills?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile?.experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Experience</h2>
            <div className="space-y-4">
              {profile.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-indigo-200 pl-4">
                  <h3 className="font-medium text-gray-900">{exp.position}</h3>
                  <p className="text-indigo-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                  {exp.description && <p className="text-gray-700 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile?.education?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Education</h2>
            <div className="space-y-4">
              {profile.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-green-200 pl-4">
                  <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                  <p className="text-green-600">{edu.institution}</p>
                  <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume */}
        {profile?.resume?.url && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Resume</h2>
            <a
              href={profile.resume.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download size={16} /> Download Resume
            </a>
          </div>
        )}

        {/* Social Links */}
        {(profile?.linkedin || profile?.github || profile?.portfolio) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Links</h2>
            <div className="flex gap-3">
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Linkedin size={16} /> LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Github size={16} /> GitHub
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Globe size={16} /> Portfolio
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;