import { body } from 'express-validator';

import isValid from './validMiddleware.js';

const userParams = {
  login: body('login').trim().toLowerCase()
    .notEmpty().withMessage('Login is required').bail()
    .isAlphanumeric().withMessage('Login must contain only letters and digits').bail()
    .matches(/^[a-z]/).withMessage('Login must start with a letter').bail()
    .isLength({ min: 3, max: 30 }).withMessage('Login must be 3-30 characters'),
  email: body('email').trim()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Email must be valid').bail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
    .isLength({ max: 100 }).withMessage('Email must be at most 100 characters'),
  password: body('password')
    .notEmpty().withMessage('Password is required').bail()
    .isStrongPassword({
      minLength: 8, maxLength: 30, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0
    }).withMessage('Password must be 8-30 characters, with at least one A-Z, one a-z and one 0-9'),
  fullName: body('fullName').optional()
    .customSanitizer((val) => {
      return val ? val.toString().split(' ').filter(w => w.trim() !== '')
        .map(w => (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ') : '';
    })
    .matches(/^[A-Za-z\s]*$/).withMessage('Full name must contain only letters and spaces').bail()
    .isLength({ max: 60 }).withMessage('Full name must be at most 60 characters'),
  dob: body('dob').optional({ checkFalsy: true }).trim()
    .isISO8601().withMessage('Date of birth must be a valid date').bail()
    .custom((val) => new Date(val) <= Date.now()).withMessage('Date of birth must not be in the future')
};

const register = [
  userParams.login, userParams.email, userParams.password, isValid
];

const login = [
  body('login').notEmpty().withMessage('Login or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  isValid
];

const emailConfirmation = [
  body('login').notEmpty().withMessage('Login is required'),
  body('email').optional({ checkFalsy: true }).trim()
    .isEmail().withMessage('Email must be valid').bail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
    .isLength({ max: 100 }).withMessage('Email must be at most 100 characters'),
  isValid
];

const passwordReset = [
  body('email').notEmpty().withMessage('Email is required'), isValid
];

const confirmPasswordReset = [userParams.password, isValid];

const updateUserProfile = [
  body()
    .custom((val) => {
      if (!val) return false;
      return !((val.login === undefined || val.login === null)
        && (val.fullName === undefined || val.fullName === null)
        && (val.dob === undefined || val.dob === null));
    }).withMessage('At least one of login, full name or date of birth is required'),
  body('login').optional().trim().toLowerCase()
    .notEmpty().withMessage('Login cannot be empty.').bail()
    .isAlphanumeric().withMessage('Login must contain only letters and digits').bail()
    .matches(/^[a-z]/).withMessage('Login must start with a letter').bail()
    .isLength({ min: 3, max: 30 }).withMessage('Login must be 3-30 characters'),
  userParams.fullName, userParams.dob,
  isValid
];

const deleteUserProfile = [
  body('password').notEmpty().withMessage('Password is required'), isValid
];

const updateUserEmail = [
  body('password').notEmpty().withMessage('Password is required'),
  userParams.email, isValid
];

const updateUserPassword = [
  body('curPassword').notEmpty().withMessage('Current password is required'),
  body('password').notEmpty().withMessage('Password is required'),
  isValid
];

export default {
  register,
  login,
  emailConfirmation,
  passwordReset,
  confirmPasswordReset,
  updateUserProfile,
  deleteUserProfile,
  updateUserEmail,
  updateUserPassword
};
