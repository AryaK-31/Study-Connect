import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

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

const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $email: String!, $password: String!, $confirmPassword: String!, $contactNumber: String) {
    signup(name: $name, email: $email, password: $password, confirmPassword: $confirmPassword, contactNumber: $contactNumber) {
      token
      user { id name contactNumber }
    }
  }
`;

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [signup, { loading: signupLoading }] = useMutation(SIGNUP_MUTATION);
  const [validatePassword, { loading: validationLoading }] = useMutation(VALIDATE_PASSWORD_MUTATION);
  const navigate = useNavigate();

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (passwordValidation && !passwordValidation.valid) {
      setErrors({ password: 'Password does not meet requirements' });
      return;
    }

    try {
      const { data } = await signup({
        variables: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          contactNumber: formData.contactNumber,
        }
      });
      localStorage.setItem('token', data.signup.token);
      navigate('/setup');
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Create an Account</h2>
        
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
            <input
              type="tel"
              placeholder="e.g., +1 234 567 890"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.contactNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
              value={formData.contactNumber}
              onChange={(e) => {
                setFormData({ ...formData, contactNumber: e.target.value });
                if (errors.contactNumber) setErrors({ ...errors, contactNumber: '' });
              }}
            />
            {errors.contactNumber && <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
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
                className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm space-y-2"
              >
                <p className={`font-medium ${passwordValidation.valid ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {passwordValidation.valid ? '✓ Password meets all requirements' : 'Password requirements:'}
                </p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{/\d/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One number (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span>
                    <span>One special character (!@#$%^&*...)</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={signupLoading || validationLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {signupLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}