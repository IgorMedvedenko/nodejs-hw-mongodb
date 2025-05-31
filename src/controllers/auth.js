import {
  registerService,
  loginService,
  refreshService,
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
  const { accessToken, refreshToken } = await loginService({ email, password });
  res.cookie(`refreshToken`, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === `production`,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    status: 200,
    message: `Successfully logged in an user!`,
    data: { accessToken },
  });
});

export const refreshController = ctrlWrapper(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw createHttpError(401, `No refresh token provided`);
  }
  const accessToken = await refreshService(refreshToken);
  res.status(200).json({
    status: 200,
    message: `Successfully refresh a session!`,
    data: { accessToken },
  });
});
