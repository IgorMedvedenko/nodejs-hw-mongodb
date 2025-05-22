import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import contactsRouter from './routers/contacts.js';
import errorHandler from './middlewares/errorHandler.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import initMongoConnection from './db/initMongoConnection.js';

dotenv.config();

export const setupServer = async () => {
  const app = express();
  app.use(cors());
  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );
  app.use(express.json());

  try {
    await initMongoConnection();
  } catch (error) {
    console.error('Failed to connect to MongoDB. Server cannot start.');
    process.exit(1);
    throw error;
  }

  app.use(`/contacts`, contactsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(server);
    });
    server.on(`error`, reject);
  });
};
