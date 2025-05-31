import User from '../db/models/user.js';
import Session from '../db/models/session.js';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || `your-acces-token-secret`;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || `your-refresh-token-secret`;
const ACCESS_TOKEN_LIFETIME = `15m`;
const REFRESH_TOKEN_LIFETIME = `30d`;

export const generateTokens = (userId) => {
  const payload = { userId };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_LIFETIME,
  });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_LIFETIME,
  });
  return { accessToken, refreshToken };
};

export const generateAccessToken = (userId) => {
  const payload = { userId };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_LIFETIME,
  });
};

export const registerService = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return null;
  }
  const newUser = new User({ name, email, password });
  return newUser.save();
};
export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw createHttpError(401, `Invalid credentials`);
  }
  const { accessToken, refreshToken } = generateTokens(user._id);
  const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000);
  const refreshTokenValidUntil = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  );
  await Session.deleteMany({ userId: user._id });
  const newSeccion = new Session({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });
  await newSeccion.save();
  return { accessToken, refreshToken };
};

export const refreshService = async (oldRefreshToken) => {
  try {
    const decoded = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    const session = await Session.findOne({
      refreshToken: oldRefreshToken,
      userId: decoded.userId,
      refreshTokenValidUntil: { $gt: new Date() },
    }).populate(`userId`);

    if (!session || !session.userId) {
      throw createHttpError(401, `Invalid or expired refresh token`);
    }

    await Session.deleteOne({ _id: session._id });

    const newAccessToken = generateAccessToken(session.userId._id);
    const newRefreshToken = jwt.sign(
      { userId: session.userId._id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME },
    );
    const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenValidUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    const newSeccion = new Session({
      userId: session.user._id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    });
    await newSeccion.save();
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      throw createHttpError(401, `Invalid or expired refresh token`);
    }
    throw error;
  }
};

export const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    return null;
  }
  const result = await Session.deleteOne({ refreshToken });
  return result.deletedCount > 0;
};
