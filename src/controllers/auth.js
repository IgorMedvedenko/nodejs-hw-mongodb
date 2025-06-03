import {
  registerService,
  loginService,
  refreshService,
  logoutService,
} from '../services/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import createHttpError from 'http-errors';

export const registerController = ctrlWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await registerService({ name, email, password });
  if (!user) {
    throw createHttpError(409, `Email in use`);
  }
  const userData = user.toObject();
  delete userData.password;
  res.status(201).json({
    status: 201,
    message: `Succeccfuly registered a user!`,
    data: userData,
  });
});

export const loginController = ctrlWrapper(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, sessionId } = await loginService({
    email,
    password,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'producton',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    status: 200,
    message: `Successfully logged in an user!`,
    data: { accessToken },
  });
});

export const refreshController = ctrlWrapper(async (req, res) => {
  const { refreshToken, sessionId } = req.cookies;
  if (!refreshToken || !sessionId) {
    throw createHttpError(401, `No refresh token or session ID provided`);
  }
  const { accessToken, newRefreshToken, newSessionId } = await refreshService(
    refreshToken,
    sessionId,
  );
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.cookie('sessoinId', newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    status: 200,
    message: `Successfully refresh a session!`,
    data: { accessToken },
  });
});
export const logoutController = ctrlWrapper(async (req, res) => {
  const { refreshToken, sessionId } = req.cookies;
  if (!refreshToken || !sessionId) {
    return res.status(204).send();
  }
  await logoutService(refreshToken, sessionId);
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(204).send();
});
