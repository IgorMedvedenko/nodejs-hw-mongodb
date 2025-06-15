import bcrypt from 'bcrypt';
import {
  FIFTEEN_MINUTES,
  THIRTY_DAYS,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from '../constants/index.js';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import jwt from 'jsonwebtoken';
import { getEnvVar } from '../utils/getEnvVar.js';
import { sendMail } from '../utils/sendMail.js';
import { SMTP } from '../constants/index.js';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, getEnvVar(ACCESS_TOKEN_SECRET), {
    expiresIn: FIFTEEN_MINUTES / 1000 + 's',
  });
  const refreshToken = jwt.sign({ userId }, getEnvVar(REFRESH_TOKEN_SECRET), {
    expiresIn: THIRTY_DAYS / 1000 + 's',
  });
  return { accessToken, refreshToken };
};

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

  await SessionsCollection.deleteMany({ userId: user._id });

  const { accessToken, refreshToken } = generateTokens(user._id);

  const newSession = await SessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
  return newSession;
};

export const refreshUser = async ({ sessionId, refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getEnvVar(REFRESH_TOKEN_SECRET));
  } catch (error) {
    if (error instanceof Error) {
      if (decoded && decoded.userId) {
        await SessionsCollection.deleteMany({ userId: decoded.userId });
      }
      throw createHttpError(
        401,
        `Unauthorized: Invalid or expired refresh token. ${error.message}`,
      );
    }
    throw error;
  }
  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
    userId: decoded.userId,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found!');
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
    userId: session.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });

  return newSession;
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.deleteOne({ _id: sessionId });
};

export const requestResetToken = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, `User not found`);
  }
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar('JWT_SECRET'),
    {
      expiresIn: '5m',
    },
  );
  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );
  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();
  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  try {
    await sendMail({
      from: getEnvVar(SMTP.SMTP_FROM),
      to: email,
      subject: 'Reset your password',
      html,
    });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};

export const resetPassword = async (payload) => {
  let entries;
  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        throw createHttpError(401, 'Token is expired.');
      }
      if (err.name === 'JsonWebTokenError') {
        throw createHttpError(401, 'Token is invalid.');
      }
      throw createHttpError(401, err.message);
    }
    throw err;
  }
  const user = await UsersCollection.findOne({
    _id: entries.sub,
    email: entries.email,
  });
  if (!user) {
    throw createHttpError(404, `User not found`);
  }
  const encryptedPassword = await bcrypt.hash(payload.password, 10);
  await SessionsCollection.deleteMany({ userId: user._id });
  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};
