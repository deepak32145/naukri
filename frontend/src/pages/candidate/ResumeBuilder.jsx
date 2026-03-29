import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';
import { Download, ArrowLeft, Mail, Phone, MapPin, Globe, Github, Linkedin } from 'lucide-react';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

const Section = ({ title, children }) => (
  <div className="mb-5">
    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 border-b border-indigo-200 pb-1 mb-3">{title}</h2>
    {children}
  </div>
);

const ResumeBuilder = () => {
  const { user } = useSelector(s => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/candidate/profile')
      .then(({ data }) => setProfile(data.profile))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    const el = document.getElementById('resume');
    if (!el) return;
    setDownloading(true);
    try {
      // dom-to-image-more renders via SVG foreignObject so the browser handles
      // all CSS natively — oklch, oklch, modern color functions all work.
      const dataUrl = await domtoimage.toPng(el, {
        scale: 2,
        useCORS: true,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (img.height * pageW) / img.width;

      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, -y, imgW, imgH);
        y += pageH;
      }

      pdf.save(`${user?.name?.replace(/\s+/g, '_') || 'resume'}_resume.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!profile) return <div className="text-center py-24 text-gray-500">Profile not found</div>;

  const formatYear = (date) => date ? new Date(date).getFullYear() : null;
  const formatMonthYear = (date) => date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;

  return (
    <>
      {/* Toolbar — hidden when printing */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between border-b bg-white sticky top-16 z-10">
        <Link to="/profile" className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
          <ArrowLeft size={14} /> Back to Profile
        </Link>
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
          <Download size={15} />
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* Resume — this is what gets printed */}
      <div id="resume" className="max-w-4xl mx-auto px-6 py-8 print:px-8 print:py-6 print:max-w-none print:shadow-none bg-white shadow-sm my-6 print:my-0 rounded-2xl print:rounded-none">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6 print:mb-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{user?.name}</h1>
            {profile.headline && <p className="text-lg text-indigo-600 mt-1 print:text-base print:text-gray-700">{profile.headline}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 print:text-xs">
              {user?.email && <span className="flex items-center gap-1"><Mail size={12} />{user.email}</span>}
              {user?.phone && <span className="flex items-center gap-1"><Phone size={12} />{user.phone}</span>}
              {profile.currentLocation && <span className="flex items-center gap-1"><MapPin size={12} />{profile.currentLocation}</span>}
              {profile.linkedinUrl && <span className="flex items-center gap-1"><Linkedin size={12} />{profile.linkedinUrl}</span>}
              {profile.githubUrl && <span className="flex items-center gap-1"><Github size={12} />{profile.githubUrl}</span>}
              {profile.portfolioUrl && <span className="flex items-center gap-1"><Globe size={12} />{profile.portfolioUrl}</span>}
            </div>
          </div>
          {profile.experienceYears > 0 && (
            <div className="shrink-0 text-right print:hidden">
              <span className="text-3xl font-bold text-indigo-600">{profile.experienceYears}</span>
              <p className="text-xs text-gray-500">yrs exp</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {profile.summary && (
          <Section title="Summary">
            <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
          </Section>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(s => (
                <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium print:bg-gray-100 print:text-gray-800">{s}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {profile.experience?.length > 0 && (
          <Section title="Work Experience">
            <div className="space-y-4">
              {profile.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                      <p className="text-sm text-gray-600">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {formatMonthYear(exp.startDate)} – {exp.isCurrent ? 'Present' : formatMonthYear(exp.endDate)}
                    </p>
                  </div>
                  {exp.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{exp.description}</p>}
                  {exp.skills?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{exp.skills.join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {profile.education?.length > 0 && (
          <Section title="Education">
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</p>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    {edu.grade && <p className="text-xs text-gray-400">Grade: {edu.grade}</p>}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {edu.startYear} – {edu.isCurrentlyStudying ? 'Present' : edu.endYear}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {profile.projects?.length > 0 && (
          <Section title="Projects">
            <div className="space-y-3">
              {profile.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {proj.url ? <a href={proj.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 print:text-gray-900">{proj.title}</a> : proj.title}
                    </p>
                    {(proj.startDate || proj.endDate) && (
                      <p className="text-xs text-gray-400 shrink-0">
                        {formatMonthYear(proj.startDate)}{proj.endDate ? ` – ${formatMonthYear(proj.endDate)}` : ''}
                      </p>
                    )}
                  </div>
                  {proj.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{proj.description}</p>}
                  {proj.skills?.length > 0 && <p className="text-xs text-gray-400 mt-1">{proj.skills.join(' · ')}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {profile.certifications?.length > 0 && (
          <Section title="Certifications">
            <div className="space-y-2">
              {profile.certifications.map((cert, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                    {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}</p>}
                  </div>
                  {cert.issueDate && <p className="text-xs text-gray-400 shrink-0">{formatMonthYear(cert.issueDate)}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {profile.languages?.length > 0 && (
          <Section title="Languages">
            <div className="flex flex-wrap gap-3">
              {profile.languages.map((l, i) => (
                <span key={i} className="text-sm text-gray-600">{l.language} <span className="text-xs text-gray-400 capitalize">({l.proficiency})</span></span>
              ))}
            </div>
          </Section>
        )}
      </div>

    </>
  );
};

export default ResumeBuilder;
