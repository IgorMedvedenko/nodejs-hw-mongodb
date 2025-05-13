import Contact from '../db/models/contact.js';

const getContactsById = async (Id) => {
  try {
    const contact = await Contact.findById(Id);
    if (!contact) {
      return null;
    }
    return contact;
  } catch (error) {
    throw new Error(`Failed to get contact by id: ${error.message}`);
  }
};

const getAllContacts = async () => {
  try {
    const contacts = await Contact.find();
    return contacts;
  } catch (error) {
    throw new Error(`Failed to get contacts: ${error.message}`);
  }
};

export default { getAllContacts, getContactsById };
