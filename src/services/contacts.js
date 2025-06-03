import Contact from '../db/models/contact.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortBy = 'name',
  sortOrder = 'asc',
  type,
  isFavourite,
  userId,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;
  const filter = { userId };
  if (type) {
    filter.contactType = type;
  }
  if (typeof isFavourite === 'boolean') {
    filter.isFavorite = isFavourite;
  }
  const query = Contact.find(filter);
  query.sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

  const contacts = await query.skip(skip).limit(limit).exec();
  const totalItems = await Contact.countDocuments(filter);
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

export const getContactsById = async (contactId, userId) => {
  const contact = await Contact.findOne({ _id: contactId, userId });
  return contact;
};

export const createContact = async (payload) => {
  const contact = await Contact.create(payload);
  return contact;
};
export const updateContact = async (
  contactId,
  userId,
  payload,
  options = {},
) => {
  const updatedContact = await Contact.findOneAndUpdate(
    { _id: contactId, userId },
    payload,
    {
      new: true,
      ...options,
    },
  );
  return updatedContact;
};

export const deleteContact = async (contactId, userId) => {
  const deletedContact = await Contact.findOneAndDelete({
    _id: contactId,
    userId,
  });
  return deletedContact;
};
