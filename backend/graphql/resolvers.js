import { User, Session, Message } from "../models/index.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { validatePassword, validateEmail } from "../utils/passwordValidator.js";
import crypto from "crypto";

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

    sentRequests: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      // Find all users who have this user's ID in their connectionRequests
      const usersWithPendingRequest = await User.find({
        connectionRequests: new mongoose.Types.ObjectId(user.id),
        // Exclude already-connected users
        _id: { $nin: (await User.findById(user.id).lean())?.connections ?? [] },
      }).lean();
      return usersWithPendingRequest;
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
    signup: async (_, { name, email, password, confirmPassword, contactNumber }) => {
      try {
        console.log(`Attempting signup for: ${email}`);

        // Validate email format
        if (!validateEmail(email)) {
          throw new Error("Invalid email format");
        }

        // Validate password match
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors.join(", "));
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error("Email already registered");
        }

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
        throw new Error(error.message || "Failed to create user");
      }
    },
    login: async (_, { email, password }) => {
      try {
        if (!validateEmail(email)) {
          throw new Error("Invalid email format");
        }

        const user = await User.findOne({ email });
        if (!user) throw new Error("Invalid email or password");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid email or password");

        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return { token, user };
      } catch (error) {
        console.error("Login Error:", error);
        throw new Error(error.message || "Login failed");
      }
    },
    validatePassword: async (_, { password }) => {
      return validatePassword(password);
    },
    forgotPassword: async (_, { email }) => {
      try {
        if (!validateEmail(email)) {
          throw new Error("Invalid email format");
        }

        const user = await User.findOne({ email });
        if (!user) {
          // Return success anyway for security reasons (don't reveal if email exists)
          return {
            success: true,
            message: "If the email exists, a reset link has been sent",
          };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        // Set token and expiry (30 minutes)
        await User.findByIdAndUpdate(user.id, {
          resetToken: hashedToken,
          resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
        });

        // Send email with reset link
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"StudyConnect" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: "Password Reset Request - StudyConnect",
              html: `
                <p>Hello ${user.name},</p>
                <p>You have requested a password reset. Click the link below to reset your password.</p>
                <p><a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
                <p>This link will expire in 30 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>StudyConnect Team</p>
              `,
              text: `Click here to reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.`,
            });
            console.log(`✅ Password reset email sent to: ${email}`);
          } catch (err) {
            console.error("Failed to send reset email:", err);
            throw new Error("Failed to send reset email");
          }
        } else {
          console.warn("Email configuration missing - reset email not sent");
        }

        return {
          success: true,
          message: "If the email exists, a reset link has been sent",
        };
      } catch (error) {
        console.error("Forgot Password Error:", error);
        throw new Error(error.message || "Failed to process password reset");
      }
    },
    resetPassword: async (_, { token, password, confirmPassword }) => {
      try {
        // Validate password match
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors.join(", "));
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with valid reset token
        const user = await User.findOne({
          resetToken: hashedToken,
          resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
          throw new Error("Invalid or expired reset token");
        }

        // Update password and clear reset token
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(user.id, {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        });

        console.log(`✅ Password reset successful for: ${user.email}`);

        // Send confirmation email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"StudyConnect" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: "Password Reset Successful - StudyConnect",
              html: `
                <p>Hello ${user.name},</p>
                <p>Your password has been successfully reset.</p>
                <p>If you did not make this change, please contact our support team immediately.</p>
                <p>Best regards,<br>StudyConnect Team</p>
              `,
            });
            console.log(`✅ Password reset confirmation email sent to: ${user.email}`);
          } catch (err) {
            console.error("Failed to send confirmation email:", err);
          }
        }

        return {
          success: true,
          message: "Password reset successful",
        };
      } catch (error) {
        console.error("Reset Password Error:", error);
        throw new Error(error.message || "Failed to reset password");
      }
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
    sendConnectionRequest: async (_, { userId }, { user, io }) => {
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

      // Emit real-time notification to the receiver
      if (io) {
        io.to(userId).emit("connection_request", {
          fromUserId: user.id,
          fromUserName: sender.name,
          fromUserEmail: sender.email,
        });
      }

      return true;
    },

    acceptConnection: async (_, { userId }, { user, io }) => {
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

      // Emit real-time notification to the sender
      if (io) {
        io.to(userId).emit("connection_accepted", {
          byUserId: user.id,
          byUserName: currentUser.name,
        });
      }

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

    deleteConversation: async (_, { otherUserId }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const conversationId = makeConversationId(user.id, otherUserId);
      const result = await Message.deleteMany({ conversationId });
      console.log(
        `🗑️  Deleted ${result.deletedCount} messages in conversation ${conversationId}`
      );
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
