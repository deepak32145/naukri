import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/axios';
import { Briefcase, Users, Eye, TrendingUp, Plus, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}><Icon size={22} /></div>
    </div>
  </div>
);

const RecruiterDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, companyRes] = await Promise.all([
          api.get('/jobs/recruiter/my-jobs'),
          api.get('/companies/my'),
        ]);
        const myJobs = jobsRes.data.jobs;
        setJobs(myJobs);
        setCompany(companyRes.data.company);

        // Get recent applications for first few jobs
        const appPromises = myJobs.slice(0, 3).map(j => api.get(`/applications/jobs/${j._id}/applications`, { params: { limit: 3 } }).then(r => r.data.applications).catch(() => []));
        const appResults = await Promise.all(appPromises);
        setRecentApps(appResults.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0);

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{company ? company.name : 'Set up your company profile to start posting jobs'}</p>
        </div>
        <Link to="/recruiter/post-job" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 text-sm">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {/* Setup banner */}
      {!company && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-yellow-800">Set up your company profile to start posting jobs and attracting candidates.</p>
          <Link to="/recruiter/company" className="shrink-0 px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600">Setup Company</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={activeJobs} icon={Briefcase} color="bg-indigo-100 text-indigo-600" sub={`of ${jobs.length} total`} />
        <StatCard label="Total Applications" value={totalApplications} icon={Users} color="bg-green-100 text-green-600" />
        <StatCard label="Job Views" value={totalViews} icon={Eye} color="bg-purple-100 text-purple-600" />
        <StatCard label="Hire Rate" value={jobs.length > 0 ? '—' : '0%'} icon={TrendingUp} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* My Jobs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Jobs</h2>
            <Link to="/recruiter/jobs" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={13} /></Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500 text-sm">No jobs posted yet</p>
              <Link to="/recruiter/post-job" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"><Plus size={13} /> Post your first job</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div key={job._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{job.location} · {job.applicationsCount || 0} applications · {timeAgo(job.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <StatusBadge status={job.status} />
                    <Link to={`/recruiter/jobs/${job._id}/applicants`} className="text-xs text-indigo-600 hover:underline whitespace-nowrap">View Apps</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Recent Applicants</h2>
          {recentApps.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No applications yet</p>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div key={app._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                    {app.candidateId?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{app.candidateId?.name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(app.createdAt)}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
