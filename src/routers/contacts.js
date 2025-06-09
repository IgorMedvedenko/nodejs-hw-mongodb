import { Router } from 'express';
import {
  getContactsController,
  getContactIdController,
  createContactController,
  patchContactController,
  deleteContactController,
} from '../controllers/contacts.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  createContactsSchema,
  updateContactsSchema,
} from '../validation/contacts.js';
import { validateBody } from '../middlewares/validateBody.js';
import { isValidId } from '../middlewares/isValidId.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', ctrlWrapper(getContactsController));

router.get('/:contactId', isValidId, ctrlWrapper(getContactIdController));

router.post(
  '/',
  validateBody(createContactsSchema),
  ctrlWrapper(createContactController),
);

router.patch(
  '/:contactId',
  validateBody(updateContactsSchema),
  isValidId,
  ctrlWrapper(patchContactController),
);

router.delete('/:contactId', isValidId, ctrlWrapper(deleteContactController));

export default router;
