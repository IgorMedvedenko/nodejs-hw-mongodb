import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      email: true,
    },
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
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `User`,
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const Contact = mongoose.model(`Contact`, contactSchema);
export default Contact;
