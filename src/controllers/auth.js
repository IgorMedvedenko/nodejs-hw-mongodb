import {
  registerUser,
  loginUser,
  refreshUsersSession,
  logoutUser,
} from '../services/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import createHttpError from 'http-errors';
import { ONE_DAY } from '../constants/index.js';

export const registerUserController = ctrlWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await registerUser({ name, email, password });
  if (!user) {
    throw createHttpError(409, `Email in use`);
  }
  const { ...userData } = user.toObject();
  delete userData.password;
  res.status(201).json({
    status: 201,
    message: `Succeccfuly registered a user!`,
    data: userData,
  });
});

export const loginUserController = ctrlWrapper(async (req, res) => {
  const { email, password } = req.body;
  const {
    accessToken,
    refreshToken,
    _id: sessionId,
  } = await loginUser({
    email,
    password,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + ONE_DAY),
    sameSite: 'Lax',
  });
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'producton',
    expires: new Date(Date.now() + ONE_DAY),
    sameSite: 'Lax',
  });
  res.status(200).json({
    status: 200,
    message: `Successfully logged in an user!`,
    data: { accessToken },
  });
});
const setupSessionCookies = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + ONE_DAY),
    sameSite: 'Lax',
  });
  res.cookie('sessionId', session._id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + ONE_DAY),
    sameSite: 'Lax',
  });
};

export const refreshUserSessionController = ctrlWrapper(async (req, res) => {
  const { refreshToken, sessionId } = req.cookies;
  if (!refreshToken || !sessionId) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    throw createHttpError(401, `No refresh token or session ID provided`);
  }
  const newSession = await refreshUsersSession({ sessionId, refreshToken });
  setupSessionCookies(res, newSession);

  res.json({
    status: 200,
    message: `Successfully refresh a session!`,
    data: { accessToken: newSession.accessToken },
  });
});
export const logoutUserController = ctrlWrapper(async (req, res) => {
  const { sessionId } = req.cookies;
  if (!sessionId) {
    return res.status(204).send();
  }
  await logoutUser(sessionId);
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.status(204).send();
});
