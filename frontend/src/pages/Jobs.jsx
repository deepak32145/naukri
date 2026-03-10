import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchJobs, setFilters, clearFilters } from '../redux/slices/jobsSlice';
import JobCard from '../components/common/JobCard';
import Spinner from '../components/common/Spinner';
import { JOB_TYPES, INDUSTRIES, EXPERIENCE_LEVELS } from '../utils/helpers';

const Jobs = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs, total, page, totalPages, loading, filters } = useSelector((s) => s.jobs);
  const [localFilters, setLocalFilters] = useState({ keyword: '', location: '', jobType: '', skills: '', salaryMin: '', salaryMax: '', industry: '', experienceMin: '', experienceMax: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const location = searchParams.get('location') || '';
    setLocalFilters((f) => ({ ...f, keyword, location }));
    dispatch(fetchJobs({ keyword, location, page: 1, limit: 10 }));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(fetchJobs({ ...localFilters, page: 1, limit: 10 }));
  };

  const handlePageChange = (p) => {
    setCurrentPage(p);
    dispatch(fetchJobs({ ...localFilters, page: p, limit: 10 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setLocalFilters({ keyword: '', location: '', jobType: '', skills: '', salaryMin: '', salaryMax: '', industry: '', experienceMin: '', experienceMax: '' });
    dispatch(fetchJobs({ page: 1, limit: 10 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row gap-3 shadow-sm mb-6">
        <div className="flex items-center gap-2 flex-1 px-3 border border-gray-200 rounded-xl">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input value={localFilters.keyword} onChange={(e) => setLocalFilters({ ...localFilters, keyword: e.target.value })}
            className="flex-1 py-2.5 text-sm outline-none" placeholder="Job title, skills, keyword" />
          {localFilters.keyword && <button type="button" onClick={() => setLocalFilters({ ...localFilters, keyword: '' })}><X size={14} className="text-gray-400" /></button>}
        </div>
        <div className="flex items-center gap-2 flex-1 px-3 border border-gray-200 rounded-xl">
          <MapPin size={16} className="text-gray-400 shrink-0" />
          <input value={localFilters.location} onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
            className="flex-1 py-2.5 text-sm outline-none" placeholder="Location" />
        </div>
        <button type="button" onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 border rounded-xl text-sm font-medium flex items-center gap-2 ${showFilters ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600'}`}>
          <SlidersHorizontal size={15} /> Filters
        </button>
        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Search</button>
      </form>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Job Type</label>
              <select value={localFilters.jobType} onChange={(e) => setLocalFilters({ ...localFilters, jobType: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All Types</option>
                {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Industry</label>
              <select value={localFilters.industry} onChange={(e) => setLocalFilters({ ...localFilters, industry: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All Industries</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Experience</label>
              <select onChange={(e) => {
                const [min, max] = e.target.value.split('-');
                setLocalFilters({ ...localFilters, experienceMin: min, experienceMax: max });
              }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="-">Any Experience</option>
                {EXPERIENCE_LEVELS.map(l => <option key={l.label} value={`${l.min}-${l.max}`}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Skills</label>
              <input value={localFilters.skills} onChange={(e) => setLocalFilters({ ...localFilters, skills: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="React, Python, SQL" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Apply Filters</button>
            <button onClick={handleClear} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Clear All</button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600"><span className="font-semibold text-gray-900">{total.toLocaleString()}</span> jobs found</p>
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" onChange={(e) => dispatch(fetchJobs({ ...localFilters, sort: e.target.value }))}>
          <option value="newest">Newest First</option>
          <option value="salary">Highest Salary</option>
          <option value="relevant">Most Relevant</option>
        </select>
      </div>

      {loading ? <Spinner className="py-16" /> : (
        <>
          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-700">No jobs found</h3>
              <p className="text-gray-400 text-sm mt-1">Try different keywords or filters</p>
              <button onClick={handleClear} className="mt-4 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50">Clear filters</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, currentPage - 2) + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                );
              })}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Jobs;
