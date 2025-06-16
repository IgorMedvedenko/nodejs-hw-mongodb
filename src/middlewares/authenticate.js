import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import { AUTH } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  const { sessionId } = req.cookies;

  const clearAuthCookies = () => {
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    clearAuthCookies();
    return next(
      createHttpError(
        401,
        'Not authorized: No token provided or invalid format',
      ),
    );
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    clearAuthCookies();
    return next(createHttpError(401, 'Not authorized: Access token missing'));
  }
  if (!sessionId) {
    clearAuthCookies();
    return next(
      createHttpError(401, 'Not authorized: Session ID missing from cookies'),
    );
  }
  let decoded;
  try {
    decoded = jwt.verify(accessToken, getEnvVar(AUTH.ACCESS_TOKEN_SECRET));
  } catch (error) {
    clearAuthCookies();
    if (error instanceof jwt.TokenExpiredError) {
      return next(createHttpError(401, 'Access token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createHttpError(401, 'Invalid access token'));
    }
    return next(
      createHttpError(401, 'Not authorized: Token verification failed'),
    );
  }
  try {
    const user = await UsersCollection.findById(decoded.userId);
    if (!user) {
      clearAuthCookies();
      return next(createHttpError(401, 'Not authorized: User not found'));
    }

    const session = await SessionsCollection.findOne({
      _id: sessionId,
      userId: user._id,
      accessToken,
      accessTokenValidUntil: { $gt: new Date() },
    });

    if (!session) {
      clearAuthCookies();
      return next(
        createHttpError(401, 'Not authorized: Invalid session or token'),
      );
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    clearAuthCookies();
    console.error('Authentication internal error:', error);
    return next(
      createHttpError(500, 'Internal Server Error during authentication'),
    );
  }
};
