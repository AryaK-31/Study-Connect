import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interests: [String],
  availability: [String],
  contactNumber: { type: String },
  profileUpdated: { type: Boolean, default: false },
  // IDs of users who have sent a pending connection request to this user
  connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // IDs of accepted connections (mutual — stored on both sides)
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, default: 'Offline' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Direct message between two users.
// `conversationId` is a stable, sorted composite of both user IDs
// so both sides share the same document set.
const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Message = mongoose.model('Message', messageSchema);
