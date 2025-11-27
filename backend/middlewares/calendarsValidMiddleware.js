import { body } from 'express-validator';

import isValid from './validMiddleware.js';

const calendarParams = {
  name: body('name').trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 30 }).withMessage('Name must be at most 30 characters'),
  description: body('description').optional().trim()
    .isLength({ max: 250 }).withMessage('Description must be at most 250 characters'),
  color: body('color').optional()
    .matches(/^#[A-Fa-f\d]{6}$/).withMessage('Color must be in hex format'),
  participants: body('participants').optional()
    .isArray().withMessage('Participants must be provided as an array').bail()
    .custom((value) => {
      if (!value.every(item => typeof item === 'string'))
        throw new Error('Participants array must contain only IDs as strings');
      return true;
    }),
  isPublic: body('isPublic').optional().customSanitizer(val => val === true || val === 'true')
};

const create = [
  calendarParams.name, calendarParams.description, calendarParams.color,
  calendarParams.participants, calendarParams.isPublic, isValid
];

const update = [
  body()
    .custom((val) => {
      if (!val) return false;
      return !((val.name === undefined || val.name === null)
        && (val.description === undefined || val.description === null)
        && (val.color === undefined || val.color === null)
        && (val.participants === undefined || val.participants === null));
    }).withMessage('At least one of name, description, color or participants is required'),
  body('name').optional().trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 30 }).withMessage('Name must be at most 30 characters'),
  calendarParams.description, calendarParams.color, calendarParams.participants, isValid
];

export default {
  create,
  update
};
