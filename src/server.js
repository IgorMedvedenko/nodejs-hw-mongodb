import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import { getEnvVar } from './utils/getEnvVar.js';
import mainRouter from './routers/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import cookieParser from 'cookie-parser';

const PORT = Number(getEnvVar('PORT', 3000));
const FRONTEND_ORIGIN = getEnvVar('FRONTEND_ORIGIN', 'http://localhost:3000');

export const startServer = () => {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.get('/', (req, res) => {
    res.json({
      message: 'Hello world!',
    });
  });

  app.use(mainRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}');
  });
};
