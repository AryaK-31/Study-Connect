import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Bell, Check, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PENDING_REQUESTS_QUERY = gql`
  query PendingRequests {
    pendingRequests {
      id
      name
      email
      interests
    }
  }
`;

const ACCEPT_CONNECTION_MUTATION = gql`
  mutation AcceptConnection($userId: ID!) {
    acceptConnection(userId: $userId)
  }
`;

const DECLINE_CONNECTION_MUTATION = gql`
  mutation DeclineConnection($userId: ID!) {
    declineConnection(userId: $userId)
  }
`;

export default function ConnectionRequests({ onConnectionAccepted }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const { data, loading, refetch } = useQuery(PENDING_REQUESTS_QUERY, {
    pollInterval: 15000, // re-check every 15s for new requests
    fetchPolicy: 'cache-and-network',
  });

  const [accept] = useMutation(ACCEPT_CONNECTION_MUTATION);
  const [decline] = useMutation(DECLINE_CONNECTION_MUTATION);

  const requests = data?.pendingRequests ?? [];

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAccept = async (userId) => {
    try {
      await accept({ variables: { userId } });
      await refetch();
      onConnectionAccepted?.();
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  const handleDecline = async (userId) => {
    try {
      await decline({ variables: { userId } });
      await refetch();
    } catch (err) {
      console.error('Decline error:', err);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Connection requests"
      >
        <Bell className="w-5 h-5" />
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Connection Requests
              </h3>
              {requests.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {requests.length}
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && requests.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  Loading…
                </div>
              )}

              {!loading && requests.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No pending requests</p>
                </div>
              )}

              {requests.map((req) => (
                <div
                  key={req.id}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {req.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {req.name}
                    </p>
                    {req.interests?.length > 0 && (
                      <p className="text-xs text-gray-400 truncate">
                        {req.interests.slice(0, 3).join(' · ')}
                      </p>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
