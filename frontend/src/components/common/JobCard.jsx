import { Link } from 'react-router-dom';
import { MapPin, Clock, Bookmark, BookmarkCheck, Briefcase, IndianRupee, Building2, BadgeCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../utils/axios';
import { toggleSaveJob } from '../../redux/slices/jobsSlice';
import { formatSalary, timeAgo, getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const JobCard = ({ job, showSaveBtn = true }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { savedJobs } = useSelector((s) => s.jobs);
  const isSaved = savedJobs.some((j) => j._id === job._id);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Login to save jobs'); return; }
    try {
      if (isSaved) {
        await api.delete(`/jobs/${job._id}/save`);
        toast.success('Job unsaved');
      } else {
        await api.post(`/jobs/${job._id}/save`);
        toast.success('Job saved!');
      }
      dispatch(toggleSaveJob(job._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Link to={`/jobs/${job._id}`} className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Company logo */}
          <div className="shrink-0">
            {job.companyId?.logo?.url ? (
              <img src={job.companyId.logo.url} alt={job.companyId.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 size={20} className="text-indigo-600" />
              </div>
            )}
          </div>

          {/* Job info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{job.title}</h3>
              {job.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Featured</span>}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm text-gray-600">{job.companyId?.name}</span>
              {job.companyId?.isVerified && <BadgeCheck size={14} className="text-indigo-500" />}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} />{job.location}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><Briefcase size={12} className="capitalize" />{job.experienceMin}-{job.experienceMax} yrs</span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1 text-xs text-gray-500"><IndianRupee size={12} />{formatSalary(job.salaryMin, job.salaryMax)}</span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{job.jobType}</span>
            </div>

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{skill}</span>
                ))}
                {job.skills.length > 4 && <span className="text-xs text-gray-400">+{job.skills.length - 4}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        {showSaveBtn && user?.role === 'candidate' && (
          <button onClick={handleSave} className={`shrink-0 p-2 rounded-lg transition-colors ${isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />{timeAgo(job.createdAt)}</span>
        <div className="flex items-center gap-2">
          {job.openings > 1 && <span className="text-xs text-gray-400">{job.openings} openings</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(job.status)}`}>{job.status}</span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
