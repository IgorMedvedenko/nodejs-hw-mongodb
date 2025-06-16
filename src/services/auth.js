import bcrypt from 'bcrypt';
import { FIFTEEN_MINUTES, THIRTY_DAYS, AUTH } from '../constants/index.js';
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
  const accessTokenSecret = getEnvVar(AUTH.ACCESS_TOKEN_SECRET);
  const refreshTokenSecret = getEnvVar(AUTH.REFRESH_TOKEN_SECRET);
  console.log(
    'JWT Access Token Secret (length):',
    accessTokenSecret ? accessTokenSecret.length : 'Not set',
  );
  console.log(
    'JWT Refresh Token Secret (length):',
    refreshTokenSecret ? refreshTokenSecret.length : 'Not set',
  );

  const accessToken = jwt.sign({ userId }, accessTokenSecret, {
    expiresIn: FIFTEEN_MINUTES / 1000 + 's',
  });
  const refreshToken = jwt.sign({ userId }, refreshTokenSecret, {
    expiresIn: THIRTY_DAYS / 1000 + 's',
  });
  return { accessToken, refreshToken };
};

export const registerUser = async ({ name, email, password }) => {
  const user = await UsersCollection.findOne({ email });
  if (user) throw createHttpError(409, 'Email in use');

  const codedPassword = await bcrypt.hash(password, 10);

  return await UsersCollection.create({
    name,
    email,
    password: codedPassword,
  });
};

export const loginUser = async ({ email, password }) => {
  console.log('Attempting login for email:', email);
  const user = await UsersCollection.findOne({ email });

  if (!user) {
    console.log('Login failed: User not found for email:', email);
    throw createHttpError(401, 'Unauthorized: User not found');
  }
  console.log('User found:', user._id);

  const isEqual = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isEqual);

  if (!isEqual) {
    console.log('Login failed: Invalid password for user:', user._id);
    throw createHttpError(401, 'Unauthorized: Invalid password');
  }

  console.log('Deleting existing sessions for user:', user._id);
  try {
    await SessionsCollection.deleteMany({ userId: user._id });
    console.log('Successfully deleted old sessions.');
  } catch (error) {
    console.error('Error deleting old sessions:', error);
  }

  console.log('Generating new tokens for user:', user._id);
  let accessToken, refreshToken;
  try {
    ({ accessToken, refreshToken } = generateTokens(user._id));
    console.log('Tokens generated successfully.');
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw createHttpError(
      500,
      'Internal Server Error: Failed to generate tokens.',
    );
  }

  console.log('Creating new session for user:', user._id);
  let newSession;
  try {
    newSession = await SessionsCollection.create({
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
      refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
    });
    console.log('New session created with ID:', newSession._id);
  } catch (error) {
    console.error('Error creating new session:', error);
    throw createHttpError(
      500,
      'Internal Server Error: Failed to create session.',
    );
  }

  console.log('Login process completed for user:', user._id);
  return newSession;
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.deleteOne({ _id: sessionId });
};

export const refreshUser = async ({ sessionId, refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getEnvVar(AUTH.REFRESH_TOKEN_SECRET));
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
    throw createHttpError(401, `Unauthorized: Session not found`);
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    await SessionsCollection.deleteOne({ _id: sessionId });
    throw createHttpError(401, `Unauthorized: Refresh token expired`);
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
    getEnvVar(AUTH.JWT_SECRET),
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
    entries = jwt.verify(payload.token, getEnvVar(AUTH.JWT_SECRET));
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
