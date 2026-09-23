// Wraps async route handlers so rejected promises reach the error middleware
// without try/catch in every controller. (Express 5 also does this natively,
// but keeping it makes the intent explicit and works if you ever downgrade.)
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
