const ApiError = require("../utils/apiError");

const errorMiddleware = (err, req, res, next) => {
  let error = err instanceof ApiError ? err : new ApiError(err.statusCode || 500, err.message);
  if (err.code === 11000) error = new ApiError(409, `${Object.keys(err.keyValue)[0]} already exists`);
  if (err.name === "CastError") error = new ApiError(400, `Invalid ID: ${err.value}`);
  if (err.name === "JsonWebTokenError") error = new ApiError(401, "Invalid token");
  if (err.name === "TokenExpiredError") error = new ApiError(401, "Token expired");

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

module.exports = { errorMiddleware, notFound };
