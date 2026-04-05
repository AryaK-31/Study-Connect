import { User, Session } from '../models/index.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return await User.findById(user.id).lean();
    },
    similarStudents: async (_, __, { user }) => {
      if (!user) return [];
      const currentUser = await User.findById(user.id).lean();
      if (!currentUser || !currentUser.interests || !currentUser.interests.length) {
        console.log(`User ${user.id} (${currentUser?.name}) has no interests defined.`);
        return [];
      }
      
      const normalizedInterests = currentUser.interests.map((i) => i.toLowerCase().trim());
      console.log(`Finding students similar to ${currentUser.name} with interests:`, normalizedInterests);
      
      // Find users who have at least one common interest
      const matches = await User.find({
        _id: { $ne: new mongoose.Types.ObjectId(user.id) },
        interests: { $in: normalizedInterests }
      }).lean();
      
      console.log(`Found ${matches.length} matching students for ${currentUser.name}`);
      return matches;
    },
    sessions: async () => {
      const sessions = await Session.find().populate('creator').populate('attendees').lean();
      console.log(`Fetched ${sessions.length} sessions`);
      return sessions;
    },
  },
  Mutation: {
    signup: async (_, { name, email, password, contactNumber }) => {
      try {
        console.log(`Attempting signup for: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, contactNumber });
        console.log(`User created successfully: ${user.id}`);
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        return { token, user };
      } catch (error) {
        console.error('Signup Error:', error);
        if (error.code === 11000) throw new Error('Email already exists', { cause: error });
        throw new Error(error.message || 'Failed to create user', { cause: error });
      }
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('Invalid email or password');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid email or password');
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      return { token, user };
    },
    updateProfile: async (_, { interests, availability, contactNumber }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      // Normalize and deduplicate interests
      const normalizedInterests = Array.from(new Set(interests.map((i) => i.toLowerCase().trim())));
      console.log(`Updating profile for user ${user.id} with interests:`, normalizedInterests);
      return await User.findByIdAndUpdate(
        user.id,
        { interests: normalizedInterests, availability, contactNumber, profileUpdated: true },
        { new: true }
      );
    },
    createSession: async (_, { title, topic, time }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Session.create({ 
        title, 
        topic, 
        time, 
        creator: new mongoose.Types.ObjectId(user.id), 
        attendees: [new mongoose.Types.ObjectId(user.id)] 
      });
    },
    deleteSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const session = await Session.findById(sessionId);
      if (!session) throw new Error('Session not found');
      if (session.creator.toString() !== user.id) {
        throw new Error('You are not authorized to delete this session');
      }
      await Session.findByIdAndDelete(sessionId);
      return true;
    },
    joinSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      const session = await Session.findById(sessionId).populate('creator');
      if (!session) throw new Error('Session not found');
      
      const updatedSession = await Session.findByIdAndUpdate(
        sessionId,
        { $addToSet: { attendees: new mongoose.Types.ObjectId(user.id) } },
        { new: true }
      ).populate('creator').populate('attendees');

      const currentUser = await User.findById(user.id);
      
      // Send email to session creator
      if (session.creator && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail({
            from: `"StudyConnect" <${process.env.EMAIL_USER}>`,
            to: session.creator.email,
            subject: `New Attendee for your session: ${session.title}`,
            text: `Hi ${session.creator.name}, 

${currentUser.name} has joined your study session "${session.title}".

Attendee Details:
Name: ${currentUser.name}
Email: ${currentUser.email}
Contact Number: ${currentUser.contactNumber || 'Not provided'}

You can coordinate with them via email or phone.`,
          });
          console.log(`✅ Session join email sent to creator: ${session.creator.email}`);
        } catch (err) {
          console.error('Failed to send session join email:', err);
        }
      }

      return updatedSession;
    },
    leaveSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const session = await Session.findById(sessionId);
      if (!session) throw new Error('Session not found');
      if (session.creator.toString() === user.id) {
        throw new Error('Creator cannot leave their own session. Delete it instead.');
      }
      return await Session.findByIdAndUpdate(
        sessionId,
        { $pull: { attendees: new mongoose.Types.ObjectId(user.id) } },
        { new: true }
      ).populate('creator').populate('attendees');
    },
    connectWithUser: async (_, { userId }, { user }) => {
      console.log('Connect mutation triggered for userId:', userId);
      if (!user) {
        console.error('Connect failed: Not authenticated');
        throw new Error('Not authenticated');
      }
      const sender = await User.findById(user.id);
      const receiver = await User.findById(userId);
      
      if (!sender) {
        console.error('Connect failed: Sender not found', user.id);
        throw new Error('Sender not found');
      }
      if (!receiver) {
        console.error('Connect failed: Receiver not found', userId);
        throw new Error('Receiver not found');
      }

      console.log(`✅ Sending connection email from ${sender.email} to ${receiver.email}`);
      
      // Attempt to send email if credentials exist
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail({
            from: `"StudyConnect" <${process.env.EMAIL_USER}>`,
            to: receiver.email,
            subject: `New Connection Request from ${sender.name}`,
            text: `Hi ${receiver.name}, ${sender.name} wants to connect with you on StudyConnect! 
            
Student ID: ${sender.id}
Contact Number: ${sender.contactNumber || 'Not provided'}
Email: ${sender.email}

You can reach them at ${sender.email}.`,
          });
          console.log('Email sent successfully');
        } catch (err) {
          console.error('Failed to send email:', err);
        }
      } else {
        console.log('Skipping email send: No SMTP credentials provided in .env');
      }
      
      return true;
    },
    deleteProfile: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Delete sessions created by the user
      await Session.deleteMany({ creator: new mongoose.Types.ObjectId(user.id) });
      
      // Remove user from all attendees lists
      await Session.updateMany(
        { attendees: new mongoose.Types.ObjectId(user.id) },
        { $pull: { attendees: new mongoose.Types.ObjectId(user.id) } }
      );
      
      // Delete the user
      await User.findByIdAndDelete(user.id);
      
      return true;
    },
  },
  User: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Session: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
};
