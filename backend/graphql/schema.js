export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    interests: [String]
    availability: [String]
    contactNumber: String
    profileUpdated: Boolean
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

  type Query {
    me: User
    similarStudents: [User]
    sessions: [Session]
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!, contactNumber: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    updateProfile(interests: [String]!, availability: [String]!, contactNumber: String): User
    createSession(title: String!, topic: String!, time: String!): Session
    deleteSession(sessionId: ID!): Boolean
    joinSession(sessionId: ID!): Session
    leaveSession(sessionId: ID!): Session
    connectWithUser(userId: ID!): Boolean
    deleteProfile: Boolean
  }
`;
