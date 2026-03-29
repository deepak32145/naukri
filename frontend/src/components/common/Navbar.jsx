import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, MessageSquare, ChevronDown, LogOut, User, Briefcase, Settings, Menu, X, Search } from 'lucide-react';
import { logoutUser } from '../../redux/slices/authSlice';
import { markAllRead } from '../../redux/slices/notificationSlice';
import { fetchNotifications } from '../../redux/slices/notificationSlice';
import { getInitials, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { notifications, unreadCount } = useSelector((s) => s.notifications);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notiRef = useRef();
  const avatarRef = useRef();

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchNotifications());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard' },
    { to: '/recruiter/jobs', label: 'My Jobs' },
    { to: '/recruiter/post-job', label: 'Post Job' },
    { to: '/recruiter/search-candidates', label: 'Find Candidates' },
    { to: '/recruiter/analytics', label: 'Analytics' },
    { to: '/recruiter/company', label: 'Company' },
  ];

  const candidateLinks = [
    { to: '/jobs', label: 'Find Jobs' },
    { to: '/recruiters/live', label: '🟢 Live Recruiters' },
    { to: '/applications', label: 'Applications' },
    { to: '/saved-jobs', label: 'Saved Jobs' },
    { to: '/job-alerts', label: 'Job Alerts' },
  ];

  const navLinks = user?.role === 'recruiter' ? recruiterLinks : user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : candidateLinks;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-indigo-600 text-white font-bold text-xl px-3 py-1 rounded-lg">N</div>
            <span className="font-bold text-xl text-indigo-600 hidden sm:block">Naukri</span>
          </Link>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Register</Link>
              </>
            ) : (
              <>
                {/* Chat */}
                <Link to="/chat" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg relative">
                  <MessageSquare size={20} />
                </Link>

                {/* Notifications */}
                <div ref={notiRef} className="relative">
                  <button onClick={() => { const opening = !notiOpen; setNotiOpen(opening); setAvatarOpen(false); if (opening && unreadCount > 0) dispatch(markAllRead()); }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                  {notiOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <span className="font-semibold text-gray-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={() => dispatch(markAllRead())} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 py-8 text-sm">No notifications</p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div key={n._id} className={`px-4 py-3 hover:bg-gray-50 border-b last:border-0 cursor-pointer ${!n.isRead ? 'bg-indigo-50' : ''}`}
                              onClick={() => { if (n.link) navigate(n.link); setNotiOpen(false); }}>
                              <p className="text-sm font-medium text-gray-800">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t">
                        <Link to="/notifications" onClick={() => setNotiOpen(false)} className="text-xs text-indigo-600 hover:underline">View all notifications</Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar dropdown */}
                <div ref={avatarRef} className="relative">
                  <button onClick={() => { setAvatarOpen(!avatarOpen); setNotiOpen(false); }} className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">{getInitials(user?.name)}</div>
                    )}
                    <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
                  </button>
                  {avatarOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
                      <div className="px-4 py-3 border-b">
                        <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                      </div>
                      {user?.role === 'candidate' && (
                        <Link to="/profile" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <User size={16} /> My Profile
                        </Link>
                      )}
                      {user?.role === 'recruiter' && (
                        <Link to="/recruiter/dashboard" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Briefcase size={16} /> Dashboard
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Settings size={16} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu btn */}
                <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && isAuthenticated && (
          <div className="md:hidden border-t py-2">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium">{l.label}</Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
