import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import Spinner from './Spinner';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, token, initializing } = useSelector((state) => state.auth);
  const location = useLocation();

  // Still waiting for fetchMe to resolve — don't redirect yet
  if (initializing) return <Spinner className="py-24" />;

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
