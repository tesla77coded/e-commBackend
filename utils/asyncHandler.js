// This function takes another function (an async route handler) as an argument.
// It returns a new function that, when executed, will execute the original function
// and catch any rejected promises, passing the error to Express's next error handler.

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
