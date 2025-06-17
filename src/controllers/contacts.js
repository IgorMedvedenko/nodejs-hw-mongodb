import {
  getAllContacts,
  getContactId,
  createContact,
  updateContact,
  deleteContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';

import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    userId: req.user._id,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactIdController = async (req, res) => {
  const { contactId } = req.params;
  const contact = await getContactId({
    _id: contactId,
    userId: req.user._id,
  });

  if (!contact) {
    throw createHttpError(404, 'Contact not found!');
  }
  res.json({
    status: 200,
    message: `Successfully found contact with id: ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res, next) => {
  const photo = req.file;
  let photoUrl;
  if (photo) {
    try {
      photoUrl = await saveFileToCloudinary(photo);
    } catch (cloudinaryError) {
      console.error(
        'Error saving file to Cloudinary for new contact:',
        cloudinaryError,
      );
      return next(createHttpError(500, 'Could not upload to Cloudinary.'));
    }
  }
  const newContactData = { ...req.body, userId: req.user._id };
  if (photoUrl) {
    newContactData.photo = photoUrl;
  }
  const contact = await createContact(newContactData);
  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    try {
      photoUrl = await saveFileToCloudinary(photo);
    } catch (cloudinaryError) {
      console.error('Error saving file to Cloudinary:', cloudinaryError);
      return next(
        createHttpError(500, 'Could not upload photo to Cloudinary.'),
      );
    }
  }
  const updateFields = { ...req.body };
  if (photoUrl) {
    updateFields.photo = photoUrl;
  }
  const result = await updateContact(
    { _id: contactId, userId: req.user._id },
    updateFields,
  );

  if (!result) {
    next(createHttpError(404, 'Contact not found!'));
    return;
  }
  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: result.contact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const contact = await deleteContact({ _id: contactId, userId: req.user._id });

  if (!contact) {
    next(createHttpError(404, 'Contact not found!'));
    return;
  }
  res.status(204).send();
};
