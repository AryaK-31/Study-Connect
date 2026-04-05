import 'dotenv/config';
import express from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import jwt from 'jsonwebtoken';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studyconnect';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Connect to MongoDB
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        let user = null;
        if (token) {
          try {
            user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
          } catch {
            // ignore
          }
        }
        return { user };
      },
    }),
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();
