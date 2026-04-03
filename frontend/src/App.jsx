import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './redux/slices/authSlice';
import { initSocket } from './utils/socket';
import SocketProvider from './components/common/SocketProvider';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CompanyProfile from './pages/CompanyProfile';
import AuthCallback from './pages/AuthCallback';

// Candidate Pages
import CandidateProfile from './pages/candidate/CandidateProfile';
import EditProfile from './pages/candidate/EditProfile';
import MyApplications from './pages/candidate/MyApplications';
import SavedJobs from './pages/candidate/SavedJobs';
import JobAlerts from './pages/candidate/JobAlerts';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJob from './pages/recruiter/PostJob';
import MyJobs from './pages/recruiter/MyJobs';
import Applicants from './pages/recruiter/Applicants';
import CandidateSearch from './pages/recruiter/CandidateSearch';
import CompanySetup from './pages/recruiter/CompanySetup';
import EditJob from './pages/recruiter/EditJob';
import Analytics from './pages/recruiter/Analytics';
import UserProfile from './pages/recruiter/UserProfile';
import ResumeBuilder from './pages/candidate/ResumeBuilder';

// Shared Pages
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import LiveRecruiters from './pages/LiveRecruiters';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';

// Layout
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingBar from './components/common/LoadingBar';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user, initializing } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
      initSocket(token);
    }
  }, [dispatch, token]);

  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Navbar />
        <LoadingBar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={initializing ? null : (!isAuthenticated ? <Login /> : <Navigate to="/" />)} />
          <Route path="/register" element={initializing ? null : (!isAuthenticated ? <Register /> : <Navigate to="/" />)} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/companies/:id" element={<CompanyProfile />} />

          {/* Candidate Routes */}
          <Route path="/profile" element={<ProtectedRoute roles={['candidate']}><CandidateProfile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute roles={['candidate']}><EditProfile /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute roles={['candidate']}><MyApplications /></ProtectedRoute>} />
          <Route path="/saved-jobs" element={<ProtectedRoute roles={['candidate']}><SavedJobs /></ProtectedRoute>} />
          <Route path="/job-alerts" element={<ProtectedRoute roles={['candidate']}><JobAlerts /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute roles={['candidate']}><ResumeBuilder /></ProtectedRoute>} />

          {/* Recruiter Routes */}
          <Route path="/recruiter/dashboard" element={<ProtectedRoute roles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/post-job" element={<ProtectedRoute roles={['recruiter']}><PostJob /></ProtectedRoute>} />
          <Route path="/recruiter/jobs" element={<ProtectedRoute roles={['recruiter']}><MyJobs /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute roles={['recruiter']}><EditJob /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:jobId/applicants" element={<ProtectedRoute roles={['recruiter']}><Applicants /></ProtectedRoute>} />
          <Route path="/recruiter/search-candidates" element={<ProtectedRoute roles={['recruiter']}><CandidateSearch /></ProtectedRoute>} />
          <Route path="/recruiter/company" element={<ProtectedRoute roles={['recruiter']}><CompanySetup /></ProtectedRoute>} />
          <Route path="/recruiter/analytics" element={<ProtectedRoute roles={['recruiter']}><Analytics /></ProtectedRoute>} />

          {/* Shared Auth Routes */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/recruiters/live" element={<ProtectedRoute roles={['candidate']}><LiveRecruiters /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute roles={['recruiter', 'admin']}><UserProfile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute roles={['admin']}><AdminJobs /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
