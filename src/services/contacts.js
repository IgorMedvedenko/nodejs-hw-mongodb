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
