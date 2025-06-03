import mongoose from 'mongoose';
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `User`,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    accessTokenValidUntil: {
      type: Date,
      required: true,
    },
    refreshTokenValidUntil: {
      type: Date,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true, versionKey: false },
);
const Session = mongoose.model(`Session`, sessionSchema);
export default Session;
