import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import { Users, Briefcase, Building2, TrendingUp, ArrowRight } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const StatCard = ({ label, value, icon: Icon, color, link }) => (
  <Link to={link || '#'} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow block">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value?.toLocaleString?.() ?? value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}><Icon size={22} /></div>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-24" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data?.stats?.totalUsers} icon={Users} color="bg-indigo-100 text-indigo-600" link="/admin/users" />
        <StatCard label="Total Jobs" value={data?.stats?.totalJobs} icon={Briefcase} color="bg-green-100 text-green-600" link="/admin/jobs" />
        <StatCard label="Companies" value={data?.stats?.totalCompanies} icon={Building2} color="bg-purple-100 text-purple-600" />
        <StatCard label="Applications" value={data?.stats?.totalApplications} icon={TrendingUp} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-700">{data?.stats?.candidates?.toLocaleString()}</p>
          <p className="text-sm text-indigo-600 mt-1">Candidates</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{data?.stats?.recruiters?.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">Recruiters</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{data?.stats?.activeJobs?.toLocaleString()}</p>
          <p className="text-sm text-yellow-600 mt-1">Active Jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="space-y-3">
            {data?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">{u.name?.[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${u.role === 'recruiter' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-sm text-indigo-600 flex items-center gap-1 hover:underline">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="space-y-3">
            {data?.recentJobs?.map(j => (
              <div key={j._id} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{j.title}</p>
                  <p className="text-xs text-gray-400">{j.companyId?.name} · {j.location}</p>
                </div>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
