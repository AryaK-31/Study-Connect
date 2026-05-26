import "dotenv/config";
import mongoose from "mongoose";
import { User, Session } from "./models/index.js";
import fs from "fs";
import path from "path";

async function seedDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected");

    // Clear existing data
    console.log("Clearing existing users and sessions...");
    await User.deleteMany({});
    await Session.deleteMany({});
    console.log("✅ Cleared existing data");

    // Read users.json
    const usersPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../database/users.json"
    );
    const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

    console.log(`Inserting ${usersData.length} users...`);
    const insertedUsers = await User.insertMany(usersData);
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    // Read sessions.json
    const sessionsPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../database/sessions.json"
    );
    const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));

    console.log(`Inserting ${sessionsData.length} sessions...`);
    const insertedSessions = await Session.insertMany(sessionsData);
    console.log(`✅ Inserted ${insertedSessions.length} sessions`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("Test credentials: alice@uts.edu.au / password123");

    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
