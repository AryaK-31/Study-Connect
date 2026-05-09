import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft } from 'lucide-react';

const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const { data } = await forgotPassword({ variables: { email } });
      if (data.forgotPassword.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and click the link to reset your password.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The link will expire in 30 minutes.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password?</h2>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-2 w-full mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
