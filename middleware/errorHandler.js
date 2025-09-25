// Middleware for routes that are not found.

const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);              // pass the error to the next global error handler
};

// global error handler Middleware, must have args so that express can recognise it

const errorHandler = (err, req, res, next) => {
  // defaulting to 500 (Internal Server Error) even if it is 200 code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose specific error checks
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (Invalid ID format)';
  };

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export { notFound, errorHandler };
