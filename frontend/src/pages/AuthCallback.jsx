import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        toast.error('Authentication failed');
        navigate('/login');
        return;
      }

      if (!token) {
        toast.error('No token received');
        navigate('/login');
        return;
      }

      try {
        // Set token in localStorage and redux
        localStorage.setItem('token', token);
        dispatch(setCredentials({ token }));

        // Fetch user data
        const { data } = await api.get('/users/me');
        dispatch(setCredentials({ user: data.user, token }));

        toast.success(`Welcome, ${data.user.name}!`);

        // Redirect based on role
        if (data.user.role === 'recruiter') navigate('/recruiter/dashboard');
        else if (data.user.role === 'admin') navigate('/admin');
        else navigate('/');
      } catch (err) {
        toast.error('Failed to complete authentication');
        navigate('/login');
      }
    };

    handleCallback();
  }, [token, error, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner className="mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;