import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, TrendingUp, Users, Briefcase, Building2, ArrowRight, Star } from 'lucide-react';
import { fetchJobs, fetchRecommended, setFilters } from '../redux/slices/jobsSlice';
import JobCard from '../components/common/JobCard';
import Spinner from '../components/common/Spinner';

const POPULAR_CATEGORIES = [
  { label: 'IT & Software', icon: '💻', keyword: 'software' },
  { label: 'Marketing', icon: '📣', keyword: 'marketing' },
  { label: 'Finance', icon: '💰', keyword: 'finance' },
  { label: 'Healthcare', icon: '🏥', keyword: 'healthcare' },
  { label: 'Design', icon: '🎨', keyword: 'design' },
  { label: 'Sales', icon: '📈', keyword: 'sales' },
  { label: 'Data Science', icon: '🤖', keyword: 'data science' },
  { label: 'HR', icon: '👥', keyword: 'human resources' },
];

const STATS = [
  { label: 'Jobs Posted', value: '50,000+', icon: Briefcase },
  { label: 'Registered Users', value: '2M+', icon: Users },
  { label: 'Companies', value: '10,000+', icon: Building2 },
  { label: 'Placements', value: '500K+', icon: TrendingUp },
];

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { jobs, recommendedJobs, loading } = useSelector((s) => s.jobs);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    dispatch(fetchJobs({ limit: 6, sort: 'newest' }));
    if (isAuthenticated && user?.role === 'candidate') {
      dispatch(fetchRecommended());
    }
  }, [dispatch, isAuthenticated, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ keyword: searchKeyword, location: searchLocation }));
    navigate(`/jobs?keyword=${encodeURIComponent(searchKeyword)}&location=${encodeURIComponent(searchLocation)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Find Your <span className="text-yellow-300">Dream Job</span><br />in India
          </h1>
          <p className="mt-4 text-indigo-200 text-lg">50,000+ jobs from top companies. Start your career journey today.</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-xl">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 text-gray-800 placeholder-gray-400 outline-none text-sm py-2"
                placeholder="Job title, skills, or keyword" />
            </div>
            <div className="hidden md:block w-px bg-gray-200" />
            <div className="flex items-center gap-2 flex-1 px-3">
              <MapPin size={18} className="text-gray-400 shrink-0" />
              <input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}
                className="flex-1 text-gray-800 placeholder-gray-400 outline-none text-sm py-2"
                placeholder="City or location" />
            </div>
            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap">
              Search Jobs
            </button>
          </form>

          <p className="mt-4 text-indigo-300 text-sm">Popular: React, Python, Java, Marketing, Data Science</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2"><Icon size={24} className="text-indigo-600" /></div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {POPULAR_CATEGORIES.map(({ label, icon, keyword }) => (
              <button key={label} onClick={() => { dispatch(setFilters({ keyword })); navigate(`/jobs?keyword=${keyword}`); }}
                className="bg-white rounded-xl p-4 text-left hover:shadow-md hover:border-indigo-200 border border-transparent transition-all group">
                <span className="text-3xl">{icon}</span>
                <p className="mt-2 font-medium text-gray-800 group-hover:text-indigo-600 text-sm">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Jobs (for logged-in candidates) */}
      {isAuthenticated && user?.role === 'candidate' && recommendedJobs.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                <p className="text-gray-500 text-sm mt-1">Based on your profile and skills</p>
              </div>
              <Link to="/jobs" className="text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="grid gap-4">
              {recommendedJobs.slice(0, 4).map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest Jobs</h2>
            <Link to="/jobs" className="text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm">View all <ArrowRight size={14} /></Link>
          </div>
          {loading ? <Spinner className="py-8" /> : (
            <div className="grid gap-4">
              {jobs.slice(0, 6).map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-indigo-600 text-white text-center">
          <h2 className="text-3xl font-bold">Ready to find your next opportunity?</h2>
          <p className="mt-3 text-indigo-200">Join 2 million+ professionals who trust Naukri</p>
          <div className="flex gap-4 justify-center mt-6">
            <Link to="/register" className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100">Create Account</Link>
            <Link to="/jobs" className="px-6 py-3 border border-white text-white rounded-xl font-semibold hover:bg-indigo-700">Browse Jobs</Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2024 Naukri Clone. Built with React & Node.js.</p>
      </footer>
    </div>
  );
};

export default Home;
