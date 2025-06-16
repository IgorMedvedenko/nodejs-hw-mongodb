import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';

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
  try {
    const session = await SessionsCollection.findOne({
      _id: sessionId,
      accessToken,
      accessTokenValidUntil: { $gt: new Date() },
    });

    if (!session) {
      clearAuthCookies();
      return next(
        createHttpError(
          401,
          'Not authorized: Invalid session, access token, or token expired',
        ),
      );
    }

    const user = await UsersCollection.findById(session.userId);
    if (!user) {
      clearAuthCookies();
      return next(
        createHttpError(401, 'Not authorized: User not found for session'),
      );
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    clearAuthCookies();
    console.error('Authentication internal error (randomBytes mode):', error);
    return next(
      createHttpError(500, 'Internal Server Error during authentication'),
    );
  }
};
