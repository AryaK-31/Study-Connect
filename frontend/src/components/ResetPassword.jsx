import { useState, useEffect } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, CheckCircle } from 'lucide-react';

const VALIDATE_PASSWORD_MUTATION = gql`
  mutation ValidatePassword($password: String!) {
    validatePassword(password: $password) {
      valid
      errors
      requirements {
        minLength
        requireUppercase
        requireLowercase
        requireNumbers
        requireSpecialChars
      }
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(token: $token, password: $password, confirmPassword: $confirmPassword) {
      success
      message
    }
  }
`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');
  const [validatePassword, { loading: validationLoading }] = useMutation(VALIDATE_PASSWORD_MUTATION);
  const [resetPassword, { loading: resetLoading }] = useMutation(RESET_PASSWORD_MUTATION);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setErrors({ submit: 'Invalid reset link. Please request a new password reset.' });
    }
  }, [token]);

  const handlePasswordChange = async (e) => {
    const password = e.target.value;
    setFormData({ ...formData, password });

    if (password) {
      try {
        const { data } = await validatePassword({ variables: { password } });
        setPasswordValidation(data.validatePassword);
      } catch (err) {
        console.error("Password validation error:", err);
      }
    } else {
      setPasswordValidation(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (passwordValidation && !passwordValidation.valid) {
      newErrors.password = 'Password does not meet requirements';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: {
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }
      });

      if (data.resetPassword.success) {
        setSuccess(true);
      }
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h2>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Request New Link
          </button>
        </motion.div>
      </div>
    );
  }

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
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with your new password.
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Reset Password</h2>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              value={formData.password}
              onChange={handlePasswordChange}
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}

            {/* Password Requirements */}
            {formData.password && passwordValidation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2"
              >
                <p className={`font-medium ${passwordValidation.valid ? 'text-green-700' : 'text-gray-700'}`}>
                  {passwordValidation.valid ? '✓ Password meets all requirements' : 'Password requirements:'}
                </p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{/\d/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One number (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One special character (!@#$%^&*...)</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={resetLoading || validationLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {resetLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
