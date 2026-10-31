const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map((err) => err.msg).join(', '),
      errors: errors.array(),
    });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate,
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const movieRules = [
  body('title').trim().notEmpty().withMessage('Movie title is required'),
  body('description').trim().notEmpty().withMessage('Movie description is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('duration').isNumeric().withMessage('Duration must be a number in minutes'),
  validate,
];

const showRules = [
  body('movie').isMongoId().withMessage('Valid movie ID is required'),
  body('theatre').isMongoId().withMessage('Valid theatre ID is required'),
  body('screen').trim().notEmpty().withMessage('Screen name is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  validate,
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  movieRules,
  showRules,
};
