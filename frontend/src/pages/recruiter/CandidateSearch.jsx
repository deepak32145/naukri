import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { Search, MapPin, MessageSquare, User } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { startConversation } from '../../redux/slices/chatSlice';
import { getInitials } from '../../utils/helpers';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const CandidateSearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', skills: '', location: '', experienceMin: '', experienceMax: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/users', { params });
      setResults(data.profiles);
    } catch (err) { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const handleStartChat = async (userId) => {
    const res = await dispatch(startConversation(userId));
    if (startConversation.fulfilled.match(res)) navigate('/chat');
    else toast.error('Failed to start chat');
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Search Candidates</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="text-xs text-gray-600 mb-1 block">Keyword</label>
            <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} className={inputClass} placeholder="e.g. React Developer" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Skills</label>
            <input value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} className={inputClass} placeholder="React, Python" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Location</label>
            <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} className={inputClass} placeholder="Bengaluru" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Min Experience (yrs)</label>
            <input type="number" value={filters.experienceMin} onChange={(e) => setFilters({ ...filters, experienceMin: e.target.value })} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Max Experience (yrs)</label>
            <input type="number" value={filters.experienceMax} onChange={(e) => setFilters({ ...filters, experienceMax: e.target.value })} className={inputClass} placeholder="10" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            <Search size={15} /> Search Candidates
          </button>
          <button type="button" onClick={() => { setFilters({ keyword: '', skills: '', location: '', experienceMin: '', experienceMax: '' }); setResults([]); setSearched(false); }}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Clear</button>
        </div>
      </form>

      {loading ? <Spinner className="py-12" /> : searched && results.length === 0 ? (
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-500">No candidates found. Try different filters.</p></div>
      ) : (
        <div className="grid gap-4">
          {results.map((profile) => (
            <div key={profile._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/users/${profile.userId._id}`)}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {profile.userId?.avatar?.url ? (
                    <img src={profile.userId.avatar.url} alt={profile.userId.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{getInitials(profile.userId?.name)}</div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{profile.userId?.name}</p>
                    {profile.headline && <p className="text-sm text-indigo-600">{profile.headline}</p>}
                    <div className="flex items-center gap-3 mt-0.5">
                      {profile.currentLocation && <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{profile.currentLocation}</span>}
                      {profile.experienceYears !== undefined && <span className="text-xs text-gray-400">{profile.experienceYears} yrs exp</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {profile.resume?.url && (
                    <a href={profile.resume.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">View Resume</a>
                  )}
                  <button onClick={() => handleStartChat(profile.userId._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100">
                    <MessageSquare size={12} /> Chat
                  </button>
                </div>
              </div>

              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.skills.slice(0, 6).map(s => <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{s}</span>)}
                  {profile.skills.length > 6 && <span className="text-xs text-gray-400">+{profile.skills.length - 6} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
