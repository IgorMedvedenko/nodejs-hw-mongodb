import {
  registerUser,
  loginUser,
  refreshUsersSession,
  logoutUser,
} from '../services/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import createHttpError from 'http-errors';
import { ONE_DAY } from '../constants/index.js';

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
const clearSessionCookies = (res) => {
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
};

export const registerUserController = ctrlWrapper(async (req, res) => {
  const { name, email } = req.body;
  const user = await registerUser({ name, email, password });
  if (!user) {
    throw createHttpError(409, `Email in use`);
  }
  const { password, ...userData } = user.toObject();
  res.status(201).json({
    status: 201,
    message: `Successfuly registered a user!`,
    data: userData,
  });
});

export const loginUserController = ctrlWrapper(async (req, res) => {
  const { email, password } = req.body;
  const session = await loginUser({
    email,
    password,
  });
  setupSessionCookies(res, session);
  res.status(200).json({
    status: 200,
    message: `Successfully logged in an user!`,
    data: { accessToken: session.accessToken },
  });
});

export const refreshUserSessionController = ctrlWrapper(async (req, res) => {
  const { refreshToken, sessionId } = req.cookies;
  if (!refreshToken || !sessionId) {
    clearSessionCookies(res);
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
    clearSessionCookies(res);
    return res.status(204).send();
  }
  await logoutUser(sessionId);
  clearSessionCookies(res);
  res.status(204).send();
});
