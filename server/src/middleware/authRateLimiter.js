
import rateLimit from "express-rate-limit";

const createAuthLimiter = (max, message) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    // Use the client's IP address as the rate-limit key.
    keyGenerator: undefined,

    message: {
      success: false,
      message,
    },

    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
  });
};

export const loginLimiter = createAuthLimiter(
  5,
  "Too many login attempts. Please try again after 15 minutes."
);

export const registerLimiter = createAuthLimiter(
  5,
  "Too many registration attempts. Please try again after 15 minutes."
);

export const forgotPasswordLimiter = createAuthLimiter(
  3,
  "Too many password reset requests. Please try again after 15 minutes."
);

export const resetPasswordLimiter = createAuthLimiter(
  5,
  "Too many password reset attempts. Please try again after 15 minutes."
);

export const changePasswordLimiter = createAuthLimiter(
  5,
  "Too many password change attempts. Please try again after 15 minutes."
);
