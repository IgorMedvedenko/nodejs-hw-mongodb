import { isHttpError } from 'http-errors';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  if (isHttpError(err)) {
    return res.status(err.statusCode || err.status).json({
      status: err.statusCode || err.status,
      message: err.message,
      data: err.data,
    });
  }

  res.status(500).json({
    status: 500,
    message: 'Something went wrong',
    data: process.env.NODE_ENV === 'development' ? err.stack : {},
  });
};
