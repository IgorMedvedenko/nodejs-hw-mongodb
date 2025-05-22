import { Router } from 'express';
import {
  getAllContactsController,
  getContactsByIdController,
  createContactController,
  patchContactController,
  deleteContactController,
} from '../controllers/contacts.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { isValidId } from '../middlewares/isValidId.js';
import {
  createContactSchema,
  updateContactSchema,
} from '../validation/contacts.js';

const contactsRouter = Router();

contactsRouter.get(`/`, ctrlWrapper(getAllContactsController));
contactsRouter.get(
  `/:contactId`,
  isValidId,
  ctrlWrapper(getContactsByIdController),
);
contactsRouter.post(
  `/`,
  validateBody(createContactSchema),
  ctrlWrapper(createContactController),
);
contactsRouter.patch(
  `/:contactId`,
  isValidId,
  validateBody(updateContactSchema),
  ctrlWrapper(patchContactController),
);
contactsRouter.delete(
  `/:contactId`,
  isValidId,
  ctrlWrapper(deleteContactController),
);

export default contactsRouter;
