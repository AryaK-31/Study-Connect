import { ApolloProvider, useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { client } from './lib/apollo';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BookOpen, Users, LogOut, Plus, Mail, Calendar, Menu, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Signup from './components/Signup';

// --- GraphQL Queries & Mutations ---
const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      interests
      availability
      contactNumber
      profileUpdated
    }
  }
`;

const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $email: String!, $password: String!, $contactNumber: String) {
    signup(name: $name, email: $email, password: $password, contactNumber: $contactNumber) {
      token
      user { id name contactNumber }
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id name }
    }
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($interests: [String]!, $availability: [String]!, $contactNumber: String) {
    updateProfile(interests: $interests, availability: $availability, contactNumber: $contactNumber) {
      id
      interests
      availability
      contactNumber
      profileUpdated
    }
  }
`;

const SIMILAR_STUDENTS_QUERY = gql`
  query SimilarStudents {
    similarStudents {
      id
      name
      email
      interests
    }
  }
`;

const SESSIONS_QUERY = gql`
  query Sessions {
    sessions {
      id
      title
      topic
      time
      location
      creator { id name }
      attendees { id name email }
    }
  }
`;

const CREATE_SESSION_MUTATION = gql`
  mutation CreateSession($title: String!, $topic: String!, $time: String!) {
    createSession(title: $title, topic: $topic, time: $time) {
      id
    }
  }
`;

const JOIN_SESSION_MUTATION = gql`
  mutation JoinSession($sessionId: ID!) {
    joinSession(sessionId: $sessionId) {
      id
      attendees { id name email }
    }
  }
`;

const LEAVE_SESSION_MUTATION = gql`
  mutation LeaveSession($sessionId: ID!) {
    leaveSession(sessionId: $sessionId) {
      id
      attendees { id name email }
    }
  }
`;

const DELETE_SESSION_MUTATION = gql`
  mutation DeleteSession($sessionId: ID!) {
    deleteSession(sessionId: $sessionId)
  }
`;

const CONNECT_MUTATION = gql`
  mutation Connect($userId: ID!) {
    connectWithUser(userId: $userId)
  }
`;

const DELETE_PROFILE_MUTATION = gql`
  mutation DeleteProfile {
    deleteProfile
  }
`;

// --- Components ---

function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <BookOpen className="w-6 h-6" />
              <span>StudyConnect</span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">Dashboard</Link>
                <Link to="/profile" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">My Profile</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-gray-600 text-sm">Hello, {user.name}</span>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">Login</Link>
                  <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Sign Up</Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</div>
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    My Profile
                  </Link>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="px-3 py-2 text-sm text-gray-500">Logged in as <span className="font-bold text-gray-900">{user.name}</span></div>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-indigo-600 bg-indigo-50"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [login] = useMutation(LOGIN_MUTATION);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const client = useApolloClient();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({ variables: formData });
      localStorage.setItem('token', data.login.token);
      await client.resetStore();
      setToast({ message: 'Login successful! Redirecting...', type: 'success' });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-2",
              toast.type === 'success' ? "bg-green-500" : "bg-red-500"
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ProfileSetup({ initialData }) {
  const [interests, setInterests] = useState(initialData?.interests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [availability, setAvailability] = useState(initialData?.availability || []);
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || '');
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);
  const [deleteProfile] = useMutation(DELETE_PROFILE_MUTATION);
  const navigate = useNavigate();
  const client = useApolloClient();

  const interestOptions = ['AI', 'Cloud Computing', 'Web Development', 'Data Science', 'Cybersecurity', 'Mobile Apps', 'Other'];
  const availabilityOptions = ['Morning', 'Afternoon', 'Evening', 'Weekends'];

  const handleInterestChange = (val) => {
    if (val === 'Other') return;
    const lowerVal = val.toLowerCase().trim();
    const existing = interests.find(i => i.toLowerCase().trim() === lowerVal);
    if (existing) {
      setInterests(interests.filter(i => i.toLowerCase().trim() !== lowerVal));
    } else {
      setInterests([...interests, val]);
    }
  };

  const addCustomInterest = () => {
    const lowerVal = customInterest.toLowerCase().trim();
    if (customInterest && !interests.some(i => i.toLowerCase().trim() === lowerVal)) {
      setInterests([...interests, customInterest]);
      setCustomInterest('');
    }
  };

  const handleAvailabilityChange = (val) => {
    if (availability.includes(val)) {
      setAvailability(availability.filter(a => a !== val));
    } else {
      setAvailability([...availability, val]);
    }
  };

  const handleSubmit = async () => {
    if (interests.length === 0 || availability.length === 0 || (!initialData?.contactNumber && !contactNumber)) {
      alert(initialData?.contactNumber
        ? 'Please select at least one interest and availability.'
        : 'Please select at least one interest, availability and provide a contact number.');
      return;
    }
    try {
      await updateProfile({ variables: { interests, availability, contactNumber } });
      await client.resetStore();
      alert('Profile updated successfully!');
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This will also delete all sessions you created. This action cannot be undone.')) return;
    try {
      await deleteProfile();
      localStorage.removeItem('token');
      await client.clearStore();
      alert('Your profile has been deleted.');
      navigate('/signup');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {initialData ? 'Edit Your Profile' : 'Complete Your Profile'}
        </h2>
        <p className="text-gray-500 mb-8">Tell us what you're interested in and when you're free.</p>

        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">Strong Interest Topics</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {interestOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleInterestChange(opt)}
                  className={cn(
                    "px-4 py-2 rounded-full border transition-all text-sm font-medium",
                    interests.includes(opt) 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Manual entry for Other..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
              />
              <button
                onClick={addCustomInterest}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {interests.map((i, idx) => (
                  <span key={`${i}-${idx}`} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    {i}
                    <button onClick={() => setInterests(interests.filter((_, xIdx) => xIdx !== idx))} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">Availability</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availabilityOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAvailabilityChange(opt)}
                  className={cn(
                    "px-4 py-3 rounded-xl border transition-all text-sm font-medium text-center",
                    availability.includes(opt)
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {!initialData?.contactNumber && (
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Contact Number</label>
              <input
                type="tel"
                placeholder="e.g., +1 234 567 890"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-4 pt-4">
            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
            >
              {initialData ? 'Update Profile' : 'Save Profile & Continue'}
            </button>
            {initialData && (
              <button
                onClick={handleDeleteProfile}
                className="w-full bg-white text-red-500 border border-red-100 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard({ currentUser }) {
  const { data: similarData } = useQuery(SIMILAR_STUDENTS_QUERY);
  const { data: sessionsData, refetch: refetchSessions, error: sessionsError } = useQuery(SESSIONS_QUERY);
  const [connect] = useMutation(CONNECT_MUTATION);
  const [joinSession] = useMutation(JOIN_SESSION_MUTATION);
  const [leaveSession] = useMutation(LEAVE_SESSION_MUTATION);
  const [createSession] = useMutation(CREATE_SESSION_MUTATION);
  const [deleteSession] = useMutation(DELETE_SESSION_MUTATION);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newSession, setNewSession] = useState({ title: '', topic: '', time: '' });
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('interests');
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    console.log('Dashboard Similar Students Data:', similarData);
    console.log('Dashboard Sessions Data:', sessionsData);
    if (sessionsError) console.error('Dashboard Sessions Error:', sessionsError);
  }, [similarData, sessionsData, sessionsError]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleConnect = async (userId) => {
    if (userId === currentUser?.id) {
      setToast({ message: "You cannot connect with yourself!", type: 'error' });
      return;
    }
    console.log('Attempting to connect with user:', userId);
    try {
      const { data } = await connect({ variables: { userId } });
      console.log('Connect response:', data);
      setToast({ message: 'Connection request sent! (Check server logs for simulation)', type: 'success' });
      setSentRequests(prev => Array.from(new Set([...prev, userId])));
    } catch (err) {
      console.error('Connect error:', err);
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleJoin = async (sessionId) => {
    try {
      await joinSession({ variables: { sessionId } });
      setToast({ message: 'Joined session successfully!', type: 'success' });
      refetchSessions();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleLeave = async (sessionId) => {
    try {
      await leaveSession({ variables: { sessionId } });
      setToast({ message: 'Left session successfully!', type: 'success' });
      refetchSessions();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSession({ variables: { sessionId } });
      setToast({ message: 'Session deleted successfully!', type: 'success' });
      refetchSessions();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    try {
      await createSession({ variables: newSession });
      setShowCreateModal(false);
      setNewSession({ title: '', topic: '', time: '' });
      setToast({ message: 'Study session created!', type: 'success' });
      refetchSessions();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl shadow-2xl font-bold text-white flex items-center gap-2",
              toast.type === 'success' ? "bg-green-500" : "bg-red-500"
            )}
          >
            {toast.type === 'success' ? <Users className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex p-1 bg-gray-100 rounded-xl mb-8">
        <button
          onClick={() => setActiveTab('interests')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'interests' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"
          )}
        >
          Similar Interests
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={cn(
            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'sessions' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"
          )}
        >
          Study Sessions
        </button>
      </div>

      {/* Similar Students */}
      <section className={cn(activeTab !== 'interests' && "hidden md:block")}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Students with Similar Interests
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarData?.similarStudents?.filter(student => student)?.map((student) => (
            <motion.div
              key={student.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{student.email}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {student.interests.map((i, idx) => (
                    <span key={`${i}-${idx}`} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
              {student.id !== currentUser?.id && (
                sentRequests.includes(student.id) ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-600 py-2 rounded-lg font-bold text-sm">
                      <Check className="w-4 h-4" />
                      Request Sent
                    </div>
                    <button
                      onClick={() => handleConnect(student.id)}
                      className="text-indigo-600 text-xs font-semibold hover:underline"
                    >
                      Send Again?
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(student.id)}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Connect
                  </button>
                )
              )}
            </motion.div>
          ))}
          {similarData?.similarStudents?.length === 0 && (
            <div className="col-span-full p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No similar students found yet. Try updating your interests!</p>
            </div>
          )}
        </div>
      </section>

      {/* Study Sessions */}
      <section className={cn(activeTab !== 'sessions' && "hidden md:block")}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Study Sessions
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessionsData?.sessions?.filter(session => session && session.creator)?.map((session) => (
            <div key={session.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                    {session.topic}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-500 text-xs font-medium">{formatDate(session.time)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Created by {session.creator.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {session.attendees?.filter(a => a)?.slice(0, 5).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedUser(a)}
                        className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold hover:scale-110 transition-transform cursor-pointer"
                        title={a.name}
                      >
                        {a.name[0]}
                      </button>
                    ))}
                    {session.attendees.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-[10px] font-bold">
                        +{session.attendees.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {session.attendees.length} attending
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                {currentUser?.id === session.creator.id ? (
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="bg-red-50 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100"
                  >
                    Delete Session
                  </button>
                ) : (
                  <>
                    {session.attendees.some((a) => a.id === currentUser?.id) ? (
                      <button
                        onClick={() => handleLeave(session.id)}
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(session.id)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                      >
                        +1 Join
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Study Session</h2>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSession.topic}
                    onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time & Date</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4"
                >
                  Create Session
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative text-center"
            >
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                {selectedUser.name[0]}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedUser.name}</h3>
              <p className="text-indigo-600 font-medium mb-6">{selectedUser.email}</p>
              
              <div className="flex flex-col gap-3">
                {selectedUser.id !== currentUser?.id && (
                  sentRequests.includes(selectedUser.id) ? (
                    <div className="flex flex-col gap-2">
                      <div className="w-full bg-green-50 text-green-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Request Sent
                      </div>
                      <button
                        onClick={() => handleConnect(selectedUser.id)}
                        className="text-indigo-600 text-sm font-semibold hover:underline"
                      >
                        Send Again?
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(selectedUser.id)}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                    >
                      Send Connection Request
                    </button>
                  )
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MainApp() {
  const token = localStorage.getItem('token');
  const client = useApolloClient();
  const navigate = useNavigate();
  const { data, loading } = useQuery(ME_QUERY, {
    skip: !token,
    fetchPolicy: 'network-only'
  });

  const user = data?.me;

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await client.clearStore();
    navigate('/login');
  };

  if (loading && token) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Loading your profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={user ? (user.profileUpdated ? <Dashboard currentUser={user} /> : <Navigate to="/setup" />) : <Navigate to="/login" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/setup" element={user ? <ProfileSetup initialData={user} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfileSetup initialData={user} /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <MainApp />
      </Router>
    </ApolloProvider>
  );
}
