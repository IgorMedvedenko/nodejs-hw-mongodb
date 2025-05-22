import Contact from '../db/models/contact.js';

export const getContactsById = async (contactId) => {
  const contact = await Contact.findById(contactId);
  return contact;
};

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortBy = 'name',
  sortOrder = 'asc',
  type,
  isFavorite,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;
  const query = Contact.find();
  if (type) {
    query.where('contactType').equals(type);
  }
  if (typeof isFavorite === 'boolean') {
    query.where('isFavorite').equals(isFavorite);
  }
  query.sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
  const contacts = await query.skip(skip).limit(limit).exec();
  const totalItems = await Contact.countDocuments();
  const totalPages = Math.ceil(totalItems / perPage);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  return {
    data: contacts,
    page,
    perPage,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
};

export const createContact = async (payload) => {
  const contact = await Contact.create(payload);
  return contact;
};
export const updateContact = async (contactId, payload, options = {}) => {
  const updateContact = await Contact.findByIdAndUpdate(contactId, payload, {
    new: true,
    ...options,
  });
  return updateContact;
};

export const deleteContact = async (contactId) => {
  const contact = await Contact.findByIdAndDelete(contactId);
  return contact;
};
