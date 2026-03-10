import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/axios';
import { updateUser } from '../redux/slices/authSlice';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { otp });
      dispatch(updateUser({ isEmailVerified: true }));
      toast.success('Email verified successfully!');
      const role = user?.role;
      if (role === 'recruiter') navigate('/recruiter/company');
      else navigate('/profile/edit');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp');
      toast.success('OTP resent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
        <p className="text-gray-500 mt-2 text-sm">We sent a 6-digit OTP to <strong>{user?.email}</strong></p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/, ''))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="000000" />
          <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          Didn't receive OTP?{' '}
          <button onClick={handleResend} disabled={resending} className="text-indigo-600 font-medium hover:underline disabled:opacity-60">
            {resending ? 'Resending...' : 'Resend'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
