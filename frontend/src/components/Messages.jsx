import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Send, MessageCircle, ArrowLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getSocket } from '../lib/socket';

// ── GraphQL ────────────────────────────────────────────────────────────────

const CONVERSATIONS_QUERY = gql`
  query Conversations {
    conversations {
      conversationId
      unreadCount
      otherUser {
        id
        name
        email
        interests
      }
      lastMessage {
        id
        text
        createdAt
        sender { id }
      }
    }
  }
`;

// Fetch accepted connections to show users with no messages yet
const MY_CONNECTIONS_QUERY = gql`
  query MyConnectionsForMessages {
    myConnections {
      id
      name
      email
      interests
    }
  }
`;

const MESSAGES_QUERY = gql`
  query Messages($otherUserId: ID!, $limit: Int, $offset: Int) {
    messages(otherUserId: $otherUserId, limit: $limit, offset: $offset) {
      id
      conversationId
      text
      read
      createdAt
      sender { id name }
      recipient { id name }
    }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}

// ── ConversationList ───────────────────────────────────────────────────────

function ConversationList({ currentUserId, selectedId, onSelect, liveUnread }) {
  const { data: convData, loading: convLoading, refetch } = useQuery(CONVERSATIONS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: connData, loading: connLoading } = useQuery(MY_CONNECTIONS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Re-fetch when a new message arrives so last-message preview updates
  const socket = getSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, refetch]);

  const loading = convLoading && connLoading && !convData && !connData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  const conversations = convData?.conversations ?? [];
  const connections = connData?.myConnections ?? [];

  // Build a unified list:
  // 1. Existing conversations (have messages), sorted by last message
  // 2. Connected users with no conversation yet
  const conversationUserIds = new Set(conversations.map((c) => c.otherUser.id));
  const newConnections = connections.filter((u) => !conversationUserIds.has(u.id));

  if (conversations.length === 0 && connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-6 text-center">
        <Users size={40} className="opacity-30" />
        <p className="text-sm font-medium">No connections yet</p>
        <p className="text-xs">Accept a connection request or send one from the Dashboard to start chatting.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-y-auto h-full">
      {/* Active conversations */}
      {conversations.map((conv) => {
        const isSelected = selectedId === conv.conversationId;
        const unread = liveUnread[conv.conversationId] ?? conv.unreadCount;

        return (
          <li key={conv.conversationId}>
            <button
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-indigo-50 transition-colors',
                isSelected && 'bg-indigo-50 border-l-4 border-indigo-500'
              )}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-semibold text-sm">
                {conv.otherUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {conv.otherUser.name}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(conv.lastMessage?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage
                      ? (conv.lastMessage.sender.id === currentUserId ? 'You: ' : '') +
                        conv.lastMessage.text
                      : 'No messages yet'}
                  </p>
                  {unread > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}

      {/* Connected users with no messages yet */}
      {newConnections.length > 0 && (
        <>
          {conversations.length > 0 && (
            <li className="px-4 py-2 bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                New Connections
              </span>
            </li>
          )}
          {newConnections.map((conn) => {
            const convId = makeConversationId(currentUserId, conn.id);
            const isSelected = selectedId === convId;
            return (
              <li key={conn.id}>
                <button
                  onClick={() =>
                    onSelect({
                      conversationId: convId,
                      otherUser: conn,
                      lastMessage: null,
                      unreadCount: 0,
                    })
                  }
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-indigo-50 transition-colors',
                    isSelected && 'bg-indigo-50 border-l-4 border-indigo-500'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-semibold text-sm">
                    {conn.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm truncate block">
                      {conn.name}
                    </span>
                    <p className="text-xs text-indigo-400 mt-0.5">Say hello! 👋</p>
                  </div>
                </button>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
}

// ── ChatWindow ─────────────────────────────────────────────────────────────

function ChatWindow({ currentUserId, conversation, onBack }) {
  const [text, setText] = useState('');
  const [liveMessages, setLiveMessages] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const socket = getSocket();

  const { data, loading } = useQuery(MESSAGES_QUERY, {
    variables: { otherUserId: conversation.otherUser.id, limit: 100 },
    fetchPolicy: 'cache-and-network',
    skip: !conversation,
  });

  // Seed live messages from GraphQL history
  useEffect(() => {
    if (data?.messages) {
      setLiveMessages(data.messages);
    }
  }, [data]);

  // Listen for incoming socket messages for this conversation
  useEffect(() => {
    if (!socket) return;
    const convId = makeConversationId(currentUserId, conversation.otherUser.id);

    const handler = (msg) => {
      if (msg.conversationId !== convId) return;
      setLiveMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, currentUserId, conversation.otherUser.id]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (!socket) return;
    const convId = makeConversationId(currentUserId, conversation.otherUser.id);
    socket.emit('mark_read', { conversationId: convId });
  }, [socket, currentUserId, conversation.otherUser.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  // Focus input when conversation opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation]);

  const sendMessage = useCallback(() => {
    if (!text.trim() || !socket) return;
    socket.emit('send_message', {
      recipientId: conversation.otherUser.id,
      text: text.trim(),
    });
    setText('');
  }, [text, socket, conversation.otherUser.id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  for (const msg of liveMessages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: 'date', label: d, key: d + msg.id });
      lastDate = d;
    }
    grouped.push({ type: 'message', msg, key: msg.id });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
          {conversation.otherUser.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">
            {conversation.otherUser.name}
          </p>
          {conversation.otherUser.interests?.length > 0 && (
            <p className="text-xs text-gray-400 truncate max-w-xs">
              {conversation.otherUser.interests.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
        {loading && liveMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">Loading messages…</div>
        )}
        {!loading && liveMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hello! 👋
          </div>
        )}

        <AnimatePresence initial={false}>
          {grouped.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              );
            }

            const { msg } = item;
            const isMine = msg.sender.id === currentUserId;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1 text-right',
                      isMine ? 'text-indigo-200' : 'text-gray-400'
                    )}
                  >
                    {formatTime(msg.createdAt)}
                    {isMine && (
                      <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ── MessagesPage ───────────────────────────────────────────────────────────

export default function MessagesPage({ currentUser, initialRecipient }) {
  const [selectedConv, setSelectedConv] = useState(
    initialRecipient
      ? {
          conversationId: makeConversationId(currentUser.id, initialRecipient.id),
          otherUser: initialRecipient,
        }
      : null
  );
  // Track live unread counts driven by socket events (reset to 0 when opened)
  const [liveUnread, setLiveUnread] = useState({});
  const socket = getSocket();

  // Increment unread badge when a message arrives for a conversation not currently open
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.sender.id === currentUser.id) return; // own message
      const isOpen = selectedConv?.conversationId === msg.conversationId;
      if (!isOpen) {
        setLiveUnread((prev) => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1,
        }));
      }
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, currentUser.id, selectedConv]);

  const handleSelect = (conv) => {
    setSelectedConv(conv);
    // Clear unread badge for this conversation
    setLiveUnread((prev) => ({ ...prev, [conv.conversationId]: 0 }));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar — hidden on mobile when a chat is open */}
      <div
        className={cn(
          'w-full md:w-80 border-r border-gray-100 flex flex-col flex-shrink-0',
          selectedConv ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={18} className="text-indigo-500" />
            Messages
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            currentUserId={currentUser.id}
            selectedId={selectedConv?.conversationId}
            onSelect={handleSelect}
            liveUnread={liveUnread}
          />
        </div>
      </div>

      {/* Chat window */}
      <div className={cn('flex-1 flex flex-col', !selectedConv && 'hidden md:flex')}>
        {selectedConv ? (
          <ChatWindow
            currentUserId={currentUser.id}
            conversation={selectedConv}
            onBack={() => setSelectedConv(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <MessageCircle size={48} className="opacity-20" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
