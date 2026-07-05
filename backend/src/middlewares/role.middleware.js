const ApiError = require("../utils/apiError");

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new ApiError(403, `Role '${req.user.role}' is not allowed`);
  next();
};

module.exports = { restrictTo };
