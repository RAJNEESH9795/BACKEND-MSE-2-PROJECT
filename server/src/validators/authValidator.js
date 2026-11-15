import { body, validationResult } from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("en-IN")
    .withMessage("Please provide a valid Indian phone number"),

  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
];

export const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required")
];

export const changePasswordValidator = [
  body("currentPassword")
    .isString()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must contain between 8 and 128 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .isString()
    .notEmpty()
    .withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    })
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
];


export const resetPasswordValidator = [
  body("newPassword")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must contain between 8 and 128 characters.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),

  body("confirmPassword")
    .isString()
    .notEmpty()
    .withMessage("Please confirm your new password.")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];


export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    });
  }

  next();
};
