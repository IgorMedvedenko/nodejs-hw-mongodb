import { isValidObjectId } from 'mongoose';
import createHttpError from 'http-errors';

export const isValidId = (req, res, next) => {
  const { contactId } = req.params;
  if (!isValidObjectId(contactId)) {
    throw createHttpError(
      400,
      'Invalid ID format. Please provide a valid MongoDB ObjectId.',
    );
  }
  next();
};
