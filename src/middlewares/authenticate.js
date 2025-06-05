import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  const { sessionId } = req.cookies;
  if (!authHeader || !authHeader.startsWith(`Bearer`)) {
    return next(createHttpError(401, `Not authorized`));
  }
  const accessToken = authHeader.split(``)[1];
  if (!accessToken) {
    return next(createHttpError(401, `Not authorized`));
  }
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
  try {
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    const session = await SessionsCollection.findOne({
      _id: sessionId,
      userId: decoded.userId,
      accessToken,
      accessTokenValidUntil: { $gt: new Date() },
    });

    if (!session) {
      clearAuthCookies();
      return next(
        createHttpError(401, 'Not authorized: Invalid session or token'),
      );
    }
    const user = await UsersCollection.findById(decoded.userId);
    if (!user) {
      clearAuthCookies();
      return next(createHttpError(401, `Not authorized`));
    }
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    clearAuthCookies();
    if (error instanceof jwt.TokenExpiredError) {
      return next(createHttpError(401, `Access token expired`));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createHttpError(401, `Invalid access token`));
    }
    return next(createHttpError(401, `Not authorized`));
  }
};
