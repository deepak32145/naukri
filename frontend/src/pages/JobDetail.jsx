import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobById } from '../redux/slices/jobsSlice';
import { MapPin, Briefcase, IndianRupee, Clock, Users, BookmarkCheck, Bookmark, Share2, BadgeCheck, Building2, Star, ExternalLink } from 'lucide-react';
import api from '../utils/axios';
import { toggleSaveJob } from '../redux/slices/jobsSlice';
import { formatSalary, timeAgo, formatDate, getInitials } from '../utils/helpers';
import JobCard from '../components/common/JobCard';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentJob: job, similarJobs, loading } = useSelector((s) => s.jobs);
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { savedJobs } = useSelector((s) => s.jobs);
  const { onlineUserIds } = useSelector((s) => s.chat);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const isSaved = savedJobs.some((j) => j._id === id);
  const isRecruiterOnline = job?.postedBy && onlineUserIds.includes(job.postedBy?.toString?.() || job.postedBy);

  useEffect(() => {
    dispatch(fetchJobById(id)).then((res) => {
      if (fetchJobById.fulfilled.match(res)) setHasApplied(res.payload.hasApplied);
    });
    window.scrollTo({ top: 0 });
  }, [id, dispatch]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setApplying(true);
    try {
      await api.post(`/applications/jobs/${id}/apply`, { coverLetter });
      setHasApplied(true);
      setShowApplyModal(false);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isSaved) { await api.delete(`/jobs/${id}/save`); toast.success('Unsaved'); }
      else { await api.post(`/jobs/${id}/save`); toast.success('Job saved!'); }
      dispatch(toggleSaveJob(id));
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <Spinner className="py-24" />;
  if (!job) return <div className="text-center py-24 text-gray-500">Job not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job Header Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              {job.companyId?.logo?.url ? (
                <img src={job.companyId.logo.url} alt={job.companyId.name} className="w-16 h-16 rounded-xl object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Building2 size={24} className="text-indigo-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Link to={`/companies/${job.companyId?._id}`} className="text-indigo-600 hover:underline font-medium">{job.companyId?.name}</Link>
                      {job.companyId?.isVerified && <BadgeCheck size={16} className="text-indigo-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} className={`p-2 rounded-lg border transition-colors ${isSaved ? 'border-indigo-300 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                      {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="flex items-center gap-1 text-sm text-gray-600"><MapPin size={14} />{job.location}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-600"><Briefcase size={14} />{job.experienceMin}-{job.experienceMax} yrs</span>
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-1 text-sm text-gray-600"><IndianRupee size={14} />{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-600"><Users size={14} />{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-400"><Clock size={14} />{timeAgo(job.createdAt)}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium capitalize">{job.jobType}</span>
                  {job.isRemote && <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">Remote</span>}
                  {job.isFeatured && <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium">Featured</span>}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            {user?.role === 'candidate' && (
              <div className="mt-5 flex gap-3">
                {hasApplied ? (
                  <div className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-semibold text-center">Applied Successfully ✓</div>
                ) : (
                  <button onClick={() => setShowApplyModal(true)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                    Apply Now
                  </button>
                )}
                <Link
                  to="/chat"
                  state={{ startChat: job.postedBy }}
                  className={`relative flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${isRecruiterOnline ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                >
                  {isRecruiterOnline && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                  {isRecruiterOnline ? 'Recruiter Online — Chat Now' : 'Contact Recruiter'}
                </Link>
              </div>
            )}
            {!isAuthenticated && (
              <button onClick={() => navigate('/login')} className="mt-5 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
                Login to Apply
              </button>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Job Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Requirements</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">About Company</h3>
            <div className="flex items-center gap-3 mb-3">
              {job.companyId?.logo?.url ? (
                <img src={job.companyId.logo.url} alt={job.companyId.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building2 size={18} className="text-indigo-600" />
                </div>
              )}
              <div>
                <Link to={`/companies/${job.companyId?._id}`} className="font-semibold text-gray-900 hover:text-indigo-600">{job.companyId?.name}</Link>
                {job.companyId?.rating > 0 && (
                  <div className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /><span className="text-xs text-gray-500">{job.companyId.rating.toFixed(1)}</span></div>
                )}
              </div>
            </div>
            {job.companyId?.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{job.companyId.description}</p>}
            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
              {job.companyId?.industry && <p><span className="font-medium">Industry:</span> {job.companyId.industry}</p>}
              {job.companyId?.size && <p><span className="font-medium">Size:</span> {job.companyId.size} employees</p>}
              {job.companyId?.location && <p><span className="font-medium">HQ:</span> {job.companyId.location}</p>}
            </div>
            {job.companyId?.website && (
              <a href={job.companyId.website} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                Visit website <ExternalLink size={11} />
              </a>
            )}
            <Link to={`/companies/${job.companyId?._id}`} className="mt-3 block text-center text-xs text-indigo-600 hover:underline">
              View all jobs from this company
            </Link>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium text-right text-gray-800">{job.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium text-gray-800">{job.experienceMin}-{job.experienceMax} years</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Salary</span><span className="font-medium text-gray-800">{formatSalary(job.salaryMin, job.salaryMax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium text-gray-800">{job.location}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Job Type</span><span className="font-medium text-gray-800 capitalize">{job.jobType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Openings</span><span className="font-medium text-gray-800">{job.openings}</span></div>
              {job.deadline && <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className="font-medium text-red-500">{formatDate(job.deadline)}</span></div>}
            </div>
          </div>

          {/* Similar Jobs */}
          {similarJobs?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {similarJobs.slice(0, 3).map((j) => (
                  <Link key={j._id} to={`/jobs/${j._id}`} className="block p-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                    <p className="font-medium text-sm text-gray-800 line-clamp-1">{j.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{j.companyId?.name}</p>
                    <p className="text-xs text-indigo-600 mt-1">{j.location}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Apply for {job.title}</h2>
            <p className="text-sm text-gray-500 mb-4">at {job.companyId?.name}</p>
            <form onSubmit={handleApply}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Letter (optional)</label>
              <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell the recruiter why you're a great fit..." />
              <p className="text-xs text-gray-400 mt-1">Your resume from your profile will be included automatically.</p>
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={applying} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
