import Contact from '../db/models/contact.js';

export const getContactsById = async (contactId) => {
  const contact = await Contact.findById(contactId);
  return contact;
};

export const getAllContacts = async () => {
  const contacts = await Contact.find();
  return contacts;
};
export const createContact = async (payload) => {
  const contact = await Contact.create(payload);
  return contact;
};
export const updateContact = async (contactId, payload, options = {}) => {
  const rawResult = await Contact.findByIdAndUpdate(
    { _id: contactId },
    payload,
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );
  if (!rawResult || rawResult.result) return null;
  return {
    contact: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};

export const deleteContact = async (contactId) => {
  const contact = await Contact.findByIdAndDelete({ _id: contactId });
  return contact;
};
