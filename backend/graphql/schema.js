export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    interests: [String]
    availability: [String]
    contactNumber: String
    profileUpdated: Boolean
    connections: [User]
    connectionRequests: [User]
  }

  type Session {
    id: ID!
    title: String!
    topic: String!
    time: String!
    location: String
    creator: User
    attendees: [User]
  }

  type AuthPayload {
    token: String
    user: User
  }

  # ── Chat ──────────────────────────────────────────────────────────────────

  type Message {
    id: ID!
    conversationId: String!
    sender: User!
    recipient: User!
    text: String!
    read: Boolean!
    createdAt: String!
  }

  # Summary of a conversation shown in the inbox list
  type Conversation {
    conversationId: String!
    otherUser: User!
    lastMessage: Message
    unreadCount: Int!
  }

  type Query {
    me: User
    similarStudents: [User]
    sessions: [Session]
    # Paginated message history for a conversation with another user
    messages(otherUserId: ID!, limit: Int, offset: Int): [Message!]!
    # All conversations the current user has participated in
    conversations: [Conversation!]!
    # Pending incoming connection requests for the current user
    pendingRequests: [User!]!
    # Accepted connections for the current user
    myConnections: [User!]!
    # Users the current user has sent a pending request to (not yet accepted)
    sentRequests: [User!]!
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!, contactNumber: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    updateProfile(interests: [String]!, availability: [String]!, contactNumber: String): User
    createSession(title: String!, topic: String!, time: String!): Session
    deleteSession(sessionId: ID!): Boolean
    joinSession(sessionId: ID!): Session
    leaveSession(sessionId: ID!): Session
    # Connection request flow (replaces connectWithUser)
    sendConnectionRequest(userId: ID!): Boolean
    acceptConnection(userId: ID!): Boolean
    declineConnection(userId: ID!): Boolean
    # Deletes all messages in a conversation for the current user's view
    deleteConversation(otherUserId: ID!): Boolean
    deleteProfile: Boolean
  }
`;
