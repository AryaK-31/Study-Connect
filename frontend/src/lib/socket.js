import { io } from 'socket.io-client';

// Socket is created lazily and reused across the app.
// Call connectSocket(token) after login, disconnectSocket() on logout.

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/graphql', '') || 'http://localhost:5000';

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('💬 Socket connected');
    window.dispatchEvent(
      new CustomEvent('socket_event', {
        detail: { event: 'connect', message: 'Connected to server' },
      })
    );
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
    window.dispatchEvent(
      new CustomEvent('socket_event', {
        detail: {
          event: 'error',
          message: 'Connection to server failed. Some features may be unavailable.',
        },
      })
    );
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      window.dispatchEvent(
        new CustomEvent('socket_event', {
          detail: {
            event: 'disconnect',
            message: 'Disconnected from server. Attempting to reconnect...',
          },
        })
      );
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    window.dispatchEvent(
      new CustomEvent('socket_event', {
        detail: {
          event: 'error',
          message: 'Real-time connection error. Messages may be delayed.',
        },
      })
    );
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
