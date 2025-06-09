import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constants/index.js';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';

export const registerUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (user) throw createHttpError(409, 'Email in use');

  const codedPassword = await bcrypt.hash(payload.password, 10);

  return await UsersCollection.create({
    ...payload,
    password: codedPassword,
  });
};

export const loginUser = async ({ email, password }) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'User not found');
  }
  const isEqual = await bcrypt.compare(password, user.password);
  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

  await SessionsCollection.deleteOne({ userId: user._id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return await SessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};

const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  };
};

export const refreshUser = async ({ sessionId, refreshToken }) => {
  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found!');
  }

  if (session.refreshToken !== refreshToken) {
    throw new createHttpError(401, 'Refresh token is invalid');
  }

  if (session.refreshTokenValidUntil < new Date()) {
    throw new createHttpError(401, 'Session token expired');
  }

  const newSession = createSession();

  await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });

  return await SessionsCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.deleteOne({ _id: sessionId });
};
