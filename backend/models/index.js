import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interests: [String],
  availability: [String],
  contactNumber: { type: String },
  profileUpdated: { type: Boolean, default: false },
});

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, default: 'Offline' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
