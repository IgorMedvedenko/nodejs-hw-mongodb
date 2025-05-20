import { isHttpError } from 'http-errors';

export function errorHandler(err, req, res, next) {
  if (isHttpError(err) === true) {
    return res.status(err.status).json({
      status: err.status,
      message: err.message,
    });
  }

  res.status(500).json({
    status: 500,
    message: 'Something went wrong',
  });
  next();
}
