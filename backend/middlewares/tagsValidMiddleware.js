import { body } from 'express-validator';

import isValid from './validMiddleware.js';

const title = body('title').trim()
  .notEmpty().withMessage('Title is required').bail()
  .isLength({ max: 30 }).withMessage('Title must be at most 30 characters');

export default [title, isValid];
