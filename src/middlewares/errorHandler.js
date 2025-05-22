import { isHttpError } from 'http-errors';

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      data: err.data,
    });
  }

  res.status(500).json({
    status: 500,
    message: 'Something went wrong',
    data: process.env.NODE_ENV === 'development' ? err.stack : {},
  });
  next();
};
export default errorHandler;
