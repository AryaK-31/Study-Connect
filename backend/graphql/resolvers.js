import { User, Session, Message } from "../models/index.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Stable conversation ID shared by both participants
function makeConversationId(a, b) {
  return [a.toString(), b.toString()].sort().join("_");
}

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
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
      if (
        !currentUser ||
        !currentUser.interests ||
        !currentUser.interests.length
      ) {
        console.log(
          `User ${user.id} (${currentUser?.name}) has no interests defined.`,
        );
        return [];
      }

      const normalizedInterests = currentUser.interests.map((i) =>
        i.toLowerCase().trim(),
      );
      console.log(
        `Finding students similar to ${currentUser.name} with interests:`,
        normalizedInterests,
      );

      // Find users who have at least one common interest
      const matches = await User.find({
        _id: { $ne: new mongoose.Types.ObjectId(user.id) },
        interests: { $in: normalizedInterests },
      }).lean();

      console.log(
        `Found ${matches.length} matching students for ${currentUser.name}`,
      );
      return matches;
    },
    sessions: async () => {
      const sessions = await Session.find()
        .populate("creator")
        .populate("attendees")
        .lean();
      console.log(`Fetched ${sessions.length} sessions`);
      return sessions;
    },

    messages: async (_, { otherUserId, limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const conversationId = makeConversationId(user.id, otherUserId);
      return await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .skip(offset)
        .limit(limit)
        .populate("sender")
        .populate("recipient")
        .lean();
    },

    pendingRequests: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const currentUser = await User.findById(user.id)
        .populate("connectionRequests")
        .lean();
      return currentUser?.connectionRequests ?? [];
    },

    myConnections: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const currentUser = await User.findById(user.id)
        .populate("connections")
        .lean();
      return currentUser?.connections ?? [];
    },

    conversations: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");

      // Find all messages where the current user is a participant
      const msgs = await Message.find({
        $or: [{ sender: user.id }, { recipient: user.id }],
      })
        .sort({ createdAt: -1 })
        .populate("sender")
        .populate("recipient")
        .lean();

      // Group by conversationId, keeping only the latest message per conversation
      const seen = new Map();
      for (const msg of msgs) {
        if (!seen.has(msg.conversationId)) {
          seen.set(msg.conversationId, msg);
        }
      }

      // Build Conversation objects
      const conversations = await Promise.all(
        [...seen.values()].map(async (lastMsg) => {
          const otherUser =
            lastMsg.sender._id.toString() === user.id
              ? lastMsg.recipient
              : lastMsg.sender;

          const unreadCount = await Message.countDocuments({
            conversationId: lastMsg.conversationId,
            recipient: user.id,
            read: false,
          });

          return {
            conversationId: lastMsg.conversationId,
            otherUser,
            lastMessage: lastMsg,
            unreadCount,
          };
        })
      );

      return conversations;
    },
  },
  Mutation: {
    signup: async (_, { name, email, password, contactNumber }) => {
      try {
        console.log(`Attempting signup for: ${email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
          name,
          email,
          password: hashedPassword,
          contactNumber,
        });
        console.log(`User created successfully: ${user.id}`);
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        return { token, user };
      } catch (error) {
        console.error("Signup Error:", error);
        if (error.code === 11000)
          throw new Error("Email already exists", { cause: error });
        throw new Error(error.message || "Failed to create user", {
          cause: error,
        });
      }
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("Invalid email or password");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid email or password");
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      return { token, user };
    },
    updateProfile: async (
      _,
      { interests, availability, contactNumber },
      { user },
    ) => {
      if (!user) throw new Error("Not authenticated");
      // Normalize and deduplicate interests
      const normalizedInterests = Array.from(
        new Set(interests.map((i) => i.toLowerCase().trim())),
      );
      console.log(
        `Updating profile for user ${user.id} with interests:`,
        normalizedInterests,
      );
      return await User.findByIdAndUpdate(
        user.id,
        {
          interests: normalizedInterests,
          availability,
          contactNumber,
          profileUpdated: true,
        },
        { new: true },
      );
    },
    createSession: async (_, { title, topic, time }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Session.create({
        title,
        topic,
        time,
        creator: new mongoose.Types.ObjectId(user.id),
        attendees: [new mongoose.Types.ObjectId(user.id)],
      });
    },
    deleteSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const session = await Session.findById(sessionId);
      if (!session) throw new Error("Session not found");
      if (session.creator.toString() !== user.id) {
        throw new Error("You are not authorized to delete this session");
      }
      await Session.findByIdAndDelete(sessionId);
      return true;
    },
    joinSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      const session = await Session.findById(sessionId).populate("creator");
      if (!session) throw new Error("Session not found");

      const updatedSession = await Session.findByIdAndUpdate(
        sessionId,
        { $addToSet: { attendees: new mongoose.Types.ObjectId(user.id) } },
        { new: true },
      )
        .populate("creator")
        .populate("attendees");

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
Contact Number: ${currentUser.contactNumber || "Not provided"}

You can coordinate with them via email or phone.`,
          });
          console.log(
            `✅ Session join email sent to creator: ${session.creator.email}`,
          );
        } catch (err) {
          console.error("Failed to send session join email:", err);
        }
      }

      return updatedSession;
    },
    leaveSession: async (_, { sessionId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const session = await Session.findById(sessionId);
      if (!session) throw new Error("Session not found");
      if (session.creator.toString() === user.id) {
        throw new Error(
          "Creator cannot leave their own session. Delete it instead.",
        );
      }
      return await Session.findByIdAndUpdate(
        sessionId,
        { $pull: { attendees: new mongoose.Types.ObjectId(user.id) } },
        { new: true },
      )
        .populate("creator")
        .populate("attendees");
    },
    sendConnectionRequest: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      if (userId === user.id) throw new Error("Cannot connect with yourself");

      const [sender, receiver] = await Promise.all([
        User.findById(user.id),
        User.findById(userId),
      ]);
      if (!sender) throw new Error("Sender not found");
      if (!receiver) throw new Error("User not found");

      // Ignore if already connected or request already pending
      const alreadyConnected = sender.connections
        .map((id) => id.toString())
        .includes(userId);
      const alreadyPending = receiver.connectionRequests
        .map((id) => id.toString())
        .includes(user.id);

      if (alreadyConnected || alreadyPending) return true;

      await User.findByIdAndUpdate(userId, {
        $addToSet: { connectionRequests: new mongoose.Types.ObjectId(user.id) },
      });

      console.log(`📨 Connection request: ${sender.name} → ${receiver.name}`);
      return true;
    },

    acceptConnection: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      const currentUser = await User.findById(user.id);
      if (!currentUser) throw new Error("User not found");

      const requestExists = currentUser.connectionRequests
        .map((id) => id.toString())
        .includes(userId);
      if (!requestExists) throw new Error("No pending request from this user");

      // Add each other to connections, remove the pending request
      await Promise.all([
        User.findByIdAndUpdate(user.id, {
          $addToSet: { connections: new mongoose.Types.ObjectId(userId) },
          $pull: { connectionRequests: new mongoose.Types.ObjectId(userId) },
        }),
        User.findByIdAndUpdate(userId, {
          $addToSet: { connections: new mongoose.Types.ObjectId(user.id) },
        }),
      ]);

      console.log(`✅ Connection accepted between ${user.id} and ${userId}`);
      return true;
    },

    declineConnection: async (_, { userId }, { user }) => {
      if (!user) throw new Error("Not authenticated");

      await User.findByIdAndUpdate(user.id, {
        $pull: { connectionRequests: new mongoose.Types.ObjectId(userId) },
      });

      console.log(`❌ Connection declined: ${userId} → ${user.id}`);
      return true;
    },
    deleteProfile: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");

      // Delete sessions created by the user
      await Session.deleteMany({
        creator: new mongoose.Types.ObjectId(user.id),
      });

      // Remove user from all attendees lists
      await Session.updateMany(
        { attendees: new mongoose.Types.ObjectId(user.id) },
        { $pull: { attendees: new mongoose.Types.ObjectId(user.id) } },
      );

      // Delete the user
      await User.findByIdAndDelete(user.id);

      return true;
    },
  },
  User: {
    id: (parent) => parent.id || parent._id?.toString(),
    connections: (parent) => parent.connections ?? [],
    connectionRequests: (parent) => parent.connectionRequests ?? [],
  },
  Session: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Message: {
    id: (parent) => parent.id || parent._id?.toString(),
    createdAt: (parent) =>
      parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt,
  },
  Conversation: {
    otherUser: (parent) => parent.otherUser,
    lastMessage: (parent) => parent.lastMessage ?? null,
  },
};
