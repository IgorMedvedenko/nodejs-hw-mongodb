import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/index.js';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || `your-acces-token-secret`;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || `your-refresh-token-secret`;

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: FIFTEEN_MINUTES / 1000 + 's',
  });
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: ONE_DAY / 1000 + 's',
  });
  return { accessToken, refreshToken };
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await UsersCollection.findOne({ email });
  if (existingUser) return null;

  return UsersCollection.create({
    name,
    email,
    password,
  });
};
export const loginUser = async ({ email, password }) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(401, `Unauthorized: User not found`);
  }
  const isEqual = await user.comparePassword(password);
  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized: Invalid password');
  }
  await SessionsCollection.deleteMany({ userId: user._id });
  const { accessToken, refreshToken } = generateTokens(user._id);
  const newSession = await SessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
  return newSession;
};

export const logoutUser = async (sessionId) => {
  const result = await SessionsCollection.deleteOne({ _id: sessionId });
  return result.deletedCount > 0;
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch {
    if (decoded && decoded.userId) {
      await SessionsCollection.deleteMany({ userId: decoded.userId });
    }
    throw createHttpError(
      401,
      'Unauthorized: Invalid or expired refresh token',
    );
  }

  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
    userId: decoded.userId,
  });
  if (!session) {
    throw createHttpError(401, 'Unauthorized: Session not found');
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    await SessionsCollection.deleteOne({ _id: sessionId });
    throw createHttpError(401, 'Unauthorized: Refresh token expired');
  }

  await SessionsCollection.deleteOne({ _id: sessionId });

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    generateTokens(session.userId);
  const newSession = await SessionsCollection.create({
    userId: session.userId._id,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
  return newSession;
};
