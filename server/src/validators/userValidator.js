import { body } from "express-validator";

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("en-IN")
    .withMessage("Invalid Indian phone number"),

  body("community")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Community name is too long"),

  body("profilePhoto")
    .optional()
    .isURL()
    .withMessage("Profile photo must be a valid URL")
];