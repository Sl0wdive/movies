import fs from "fs";
import { promisify } from "util";
const readFile = promisify(fs.readFile);
import { body } from "express-validator";

export const validateMovieFile = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const content = await readFile(req.file.path, "utf-8");
    const movieBlocks = content
      .split("\n\n")
      .filter((block) => block.trim() !== "");

    if (movieBlocks.length === 0) {
      throw new Error("File is empty or invalid format");
    }

    for (const block of movieBlocks) {
      const lines = block.split("\n");
      const requiredFields = ["Title:", "Release Year:", "Format:", "Stars:"];

      if (lines.length < 4) {
        throw new Error(
          `Invalid movie block format. Each movie must have title, year, format and stars.`
        );
      }

      for (const field of requiredFields) {
        if (!lines.some((line) => line.startsWith(field))) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    req.movieFileContent = content;
    next();
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      error: "Invalid file format",
      details: error.message,
    });
  }
};

export const registerValidation = [
  body("email", "Invalid email format. Please enter a valid email address.")
    .isEmail()
    .matches(/^[\x00-\x7F]+$/)
    .normalizeEmail(),
  body("password", "Password must be at least 5 characters long.")
    .trim()
    .isLength({
      min: 5,
    }),
  body("name", "Full name must be at least 3 characters long.")
    .trim()
    .isLength({
      min: 3,
    }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }
    return true;
  }),
];

export const loginValidation = [
  body(
    "email",
    "Invalid email format. Please enter a valid email address."
  ).isEmail(),
  body("password", "Password must be at least 5 characters long.").isLength({
    min: 5,
  }),
];

export const movieValidation = [
  body("title", "Title is required and must be at least 1 character long.")
    .isString()
    .trim()
    .isLength({ min: 1 }),
  body(
    "year",
    "Year must be a valid integer between 1888 and the current year."
  ).isInt({ min: 1888, max: new Date().getFullYear() }),
  body("format", "Format must be one of: VHS, DVD, Blu-ray.").isIn([
    "VHS",
    "DVD",
    "Blu-ray",
  ]),
  body("actors", "Actors must be a non-empty array of strings.").isArray({
    min: 1,
  }),
  body("actors.*", "Invalid actor name format. Please enter a valid name.")
    .isString()
    .trim()
    .isLength({ min: 1 })
    .matches(/^[a-zA-Zа-яА-ЯёЁїЇєЄіІґҐ\-\.,\s]+$/)
    .isLength({ min: 1 }),
];
