import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSavedJobs } from '../../redux/slices/jobsSlice';
import JobCard from '../../components/common/JobCard';
import Spinner from '../../components/common/Spinner';

const SavedJobs = () => {
  const dispatch = useDispatch();
  const { savedJobs, loading } = useSelector((s) => s.jobs);

  useEffect(() => { dispatch(fetchSavedJobs()); }, [dispatch]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Saved Jobs <span className="text-gray-400 font-normal text-base">({savedJobs.length})</span></h1>
      {loading ? <Spinner className="py-12" /> : savedJobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🔖</p>
          <h3 className="font-semibold text-gray-700">No saved jobs yet</h3>
          <p className="text-sm text-gray-400 mt-1">Bookmark jobs you're interested in</p>
          <Link to="/jobs" className="mt-4 inline-flex px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Browse Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map((job) => <JobCard key={job._id} job={job} />)}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
