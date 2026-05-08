import "dotenv/config";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { Message, User } from "./models/index.js";

// ENV
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

// Stable conversation ID: sorted user IDs joined by underscore
function makeConversationId(a, b) {
  return [a, b].sort().join("_");
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    // Each user joins a personal room so we can target them by ID
    socket.join(userId);
    console.log(`💬 Socket connected: user ${userId}`);

    // Client sends a message
    socket.on("send_message", async ({ recipientId, text }) => {
      if (!recipientId || !text?.trim()) return;

      try {
        // Only connected users may message each other
        const sender = await User.findById(userId).lean();
        const isConnected = sender?.connections
          ?.map((id) => id.toString())
          .includes(recipientId);
        if (!isConnected) {
          socket.emit("error", { message: "You must be connected to message this user" });
          return;
        }

        const conversationId = makeConversationId(userId, recipientId);
        const message = await Message.create({
          conversationId,
          sender: userId,
          recipient: recipientId,
          text: text.trim(),
        });

        const populated = await message.populate(["sender", "recipient"]);

        const payload = {
          id: populated._id.toString(),
          conversationId: populated.conversationId,
          sender: {
            id: populated.sender._id.toString(),
            name: populated.sender.name,
          },
          recipient: {
            id: populated.recipient._id.toString(),
            name: populated.recipient.name,
          },
          text: populated.text,
          read: populated.read,
          createdAt: populated.createdAt.toISOString(),
        };

        // Deliver to both sender and recipient rooms
        io.to(userId).to(recipientId).emit("new_message", payload);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark messages in a conversation as read
    socket.on("mark_read", async ({ conversationId }) => {
      if (!conversationId) return;
      await Message.updateMany(
        { conversationId, recipient: userId, read: false },
        { read: true }
      );
      // Notify the sender that their messages were read
      const otherUserId = conversationId
        .split("_")
        .find((id) => id !== userId);
      if (otherUserId) {
        io.to(otherUserId).emit("messages_read", { conversationId });
      }
    });

    socket.on("disconnect", () => {
      console.log(`💬 Socket disconnected: user ${userId}`);
    });
  });

  // ── MongoDB ────────────────────────────────────────────────────────────────
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  // ── Apollo / GraphQL ───────────────────────────────────────────────────────
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || "";
        let user = null;
        try {
          if (token) {
            user = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
          }
        } catch {}
        return { user };
      },
    })
  );

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
    console.log(`💬 Socket.io listening on port ${PORT}`);
  });
}

startServer();
