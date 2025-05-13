import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import contactsController from './controllers/contacts.js';

dotenv.config();

const setupServer = async () => {
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

  app.get(`/contacts`, contactsController.getAllContacts);
  app.get(`/contacts/:contactId`, contactsController.getContactsById);

  app.use((req, res) => {
    res.status(404).json({
      message: `Not found`,
    });
  });
  const port = process.env.PORT || 3000;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(server);
    });
    server.on('error', reject);
  });
};

export default setupServer;
