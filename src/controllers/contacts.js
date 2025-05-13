import contactsService from '../services/contacts.js';

const getContactsById = async (req, res) => {
  try {
    const contact = await contactsService.getContactsById(req.params.contactId);
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
      });
    }
    res.status(200).json({
      status: 200,
      message: `Successfully found contact with id ${req.params.contactId}!`,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactsService.getAllContacts();
    res.status(200).json({
      status: 200,
      message: 'Successfully found contacts!',
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export default { getAllContacts, getContactsById };
