import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import { Building2, MessageSquare, RefreshCw, Wifi } from 'lucide-react';
import { getInitials } from '../utils/helpers';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const LiveRecruiters = () => {
  const navigate = useNavigate();
  const { onlineUserIds } = useSelector((s) => s.chat);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(null);

  const fetchOnlineRecruiters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/online-recruiters');
      setRecruiters(data.recruiters);
    } catch (err) {
      toast.error('Failed to load online recruiters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineRecruiters();
  }, []);

  // Re-fetch when online users list changes from socket
  useEffect(() => {
    if (!loading) fetchOnlineRecruiters();
  }, [onlineUserIds.length]);

  const handlePing = async (recruiterId, recruiterName) => {
    setPinging(recruiterId);
    try {
      await api.post('/chat/conversations', { participantId: recruiterId });
      toast.success(`Starting chat with ${recruiterName}...`);
      navigate('/chat', { state: { startChat: recruiterId } });
    } catch (err) {
      toast.error('Could not start conversation');
    } finally {
      setPinging(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-xl font-bold text-gray-900">Live Recruiters</h1>
          </div>
          <p className="text-sm text-gray-500">Recruiters currently online — ping them directly</p>
        </div>
        <button onClick={fetchOnlineRecruiters} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Online count banner */}
      <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 mb-6 flex items-center gap-3">
        <Wifi size={18} className="text-green-600" />
        <p className="text-sm text-green-700">
          <span className="font-bold">{recruiters.length}</span> recruiter{recruiters.length !== 1 ? 's' : ''} online right now
        </p>
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : recruiters.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-5xl mb-3">😴</p>
          <h3 className="font-semibold text-gray-700">No recruiters online right now</h3>
          <p className="text-sm text-gray-400 mt-1">Check back later or browse job listings to message a recruiter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recruiters.map((recruiter) => (
            <div key={recruiter._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-md transition-all">
              {/* Avatar + Online dot */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {recruiter.avatar?.url ? (
                    <img src={recruiter.avatar.url} alt={recruiter.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {getInitials(recruiter.name)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{recruiter.name}</p>
                  <p className="text-xs text-green-600 font-medium">● Online now</p>
                </div>
              </div>

              {/* Company info */}
              {recruiter.company ? (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  {recruiter.company.logo?.url ? (
                    <img src={recruiter.company.logo.url} alt={recruiter.company.name} className="w-8 h-8 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-indigo-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{recruiter.company.name}</p>
                    {recruiter.company.industry && (
                      <p className="text-xs text-gray-400 truncate">{recruiter.company.industry}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Building2 size={14} className="text-gray-400" />
                  <p className="text-xs text-gray-400">No company profile yet</p>
                </div>
              )}

              {/* Ping button */}
              <button
                onClick={() => handlePing(recruiter._id, recruiter.name)}
                disabled={pinging === recruiter._id}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <MessageSquare size={15} />
                {pinging === recruiter._id ? 'Connecting...' : 'Ping Recruiter'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveRecruiters;
