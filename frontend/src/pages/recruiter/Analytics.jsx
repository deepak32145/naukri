import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';
import Spinner from '../../components/common/Spinner';
import { TrendingUp, Users, Briefcase, Eye, Award, ArrowLeft } from 'lucide-react';

const STATUS_COLORS = {
  applied: 'bg-gray-400',
  under_review: 'bg-blue-400',
  shortlisted: 'bg-indigo-500',
  interview_scheduled: 'bg-yellow-400',
  hired: 'bg-green-500',
  rejected: 'bg-red-400',
};

const STATUS_LABELS = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
};

const BarChart = ({ data, maxVal, color = 'bg-indigo-500', labelKey, valueKey }) => (
  <div className="space-y-3">
    {data.map((item, i) => {
      const pct = maxVal > 0 ? Math.round((item[valueKey] / maxVal) * 100) : 0;
      return (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-32 truncate shrink-0">{item[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{item[valueKey]}</span>
        </div>
      );
    })}
  </div>
);

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/analytics')
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-24" />;
  if (!analytics) return <div className="text-center py-24 text-gray-500">Failed to load analytics</div>;

  const { statusBreakdown, applicationsOverTime, topJobs, totalApplications, hired, hireRate, totalJobs, totalViews } = analytics;

  const maxDayCount = Math.max(...applicationsOverTime.map(d => d.count), 1);
  const maxJobApps = Math.max(...(topJobs.map(j => j.applicationsCount)), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/recruiter/dashboard" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Hiring Analytics</h1>
        <p className="text-sm text-gray-500">Last 30 days overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: totalApplications, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Jobs', value: totalJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Hire Rate', value: `${hireRate}%`, icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Applications by Status</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ _id: status, count }) => {
                const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 shrink-0 capitalize">{STATUS_LABELS[status] || status}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-12 text-right shrink-0">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Jobs by Applications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Top Jobs by Applications</h2>
          {topJobs.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No jobs yet</p>
          ) : (
            <BarChart
              data={topJobs}
              maxVal={maxJobApps}
              labelKey="title"
              valueKey="applicationsCount"
              color="bg-indigo-500"
            />
          )}
        </div>
      </div>

      {/* Applications over time */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Applications Over Time (Last 30 Days)</h2>
        </div>
        {applicationsOverTime.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No applications in the last 30 days</p>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
            {applicationsOverTime.map(({ _id: date, count }) => {
              const heightPct = Math.round((count / maxDayCount) * 100);
              return (
                <div key={date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: '28px' }}>
                  <span className="text-xs text-gray-500 font-medium">{count}</span>
                  <div className="w-5 bg-indigo-100 rounded-t-sm overflow-hidden flex items-end" style={{ height: '80px' }}>
                    <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${heightPct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 rotate-0" style={{ fontSize: '9px' }}>
                    {date.slice(5)} {/* MM-DD */}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hired vs Total */}
      {totalApplications > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Hiring Funnel</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{hired} hired</span>
                <span>{totalApplications} total</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${hireRate}%` }} />
              </div>
            </div>
            <span className="text-2xl font-bold text-green-600 shrink-0">{hireRate}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
