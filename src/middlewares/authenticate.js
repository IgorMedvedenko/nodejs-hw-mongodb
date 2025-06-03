import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User from '../db/models/user.js';
import Session from '../db/models/session.js';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.autorization;
  if (!authHeader || !authHeader.startsWith(`Bearer`)) {
    return next(createHttpError(401, `Not authorized`));
  }
  const accessToken = authHeader.split(``)[1];
  if (!accessToken) {
    return next(createHttpError(401, `Not authorized`));
  }
  try {
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    const session = await Session.findOne({
      userId: user._id,
      accessToken,
      accessTokenValidUntil: { $gt: new Date() },
    });
    if (!user || !session) {
      return next(createHttpError(401, `Not authorized`));
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(createHttpError(401, `Access token expired`));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createHttpError(401, `Invalid access token`));
    }
    return next(createHttpError(401, `Not authorized`));
  }
};
