import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: String,
    phoneNumber: {
      type: String,
      required: true,
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
    contactType: {
      type: String,
      enum: [`work`, `home`, `personal`],
      required: true,
      default: `personal`,
    },
  },
  { timestamps: true },
);

const Contact = mongoose.model(`Contact`, contactSchema);
export default Contact;
