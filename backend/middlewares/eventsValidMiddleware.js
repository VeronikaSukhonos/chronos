import { body } from 'express-validator';

import isValid from './validMiddleware.js';

const eventParams = {
  name: body('name').trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
  type: body('type').trim().toLowerCase()
    .notEmpty().withMessage('Type is required').bail()
    .isIn(['arrangement', 'reminder', 'task', 'birthday'])
    .withMessage("Type can be 'arrangement', 'reminder', 'task' or 'birthday'"),
  startDate: body('startDate').trim()
    .notEmpty().withMessage('Start Date is required').bail()
    .isISO8601({strict: true}).withMessage('Start Date must be a valid date').bail()
    .custom((val) => new Date(val) > Date.now()).withMessage('Start Date must be in the future'),
  description: body('description').optional().trim()
    .isLength({ max: 250 }).withMessage('Description must be at most 250 characters'),
  color: body('color').optional()
    .matches(/^#[A-Fa-f\d]{6}$/).withMessage('Color must be in hex format'),
  participants: body('participants').optional()
    .isArray().withMessage('Participants must be provided as array').bail()
    .custom((value) => {
      if (!value.every(item => typeof item === 'string'))
        throw new Error('Participants array must contain only Ids as strings');
      return true;
    }),
  repeat: body('repeat').optional()
    .isObject().withMessage('Repeat must be an object').bail()
    .custom((value) => {
      if (!value.frequency || !value.parameter)
        throw new Error("Repeat object must contain 'frequency' and 'parameter' fields");
      else if (typeof value.frequency != 'string' || !['year', 'month', 'week', 'day'].includes(value.frequency))
        throw new Error("Repeat frequency can be 'year', 'month', 'week' or 'day'");
      else if (typeof value.parameter != 'number' || value.parameter < 0)
        throw new Error('Repeat frequency must be a positive number');
      return true;
    }),
  tags: body('tags').optional()
    .isArray().withMessage('Tags must be provided as array'),
  endDate: body('endDate').if(body('type').isIn(['arrangement', 'task'])).optional({ checkFalsy: true }).trim()
    .isISO8601({strict: true}).withMessage('End Date must be a valid date').bail()
    .custom((val, { req }) => new Date(val) > new Date(req.body.startDate))
    .withMessage('End Date must be in the future compared to Start Date'),
  link: body('link').if(body('type').equals('arrangement')).optional()
    .isURL().withMessage('Link must be an URL')
};

const create = [
  eventParams.name, eventParams.type, eventParams.startDate,
  eventParams.description, eventParams.color, eventParams.participants, /*eventParams.repeat, */eventParams.tags,
  eventParams.endDate, eventParams.link,
  isValid
];

const update = [
  body()
    .custom((val) => {
      if (!val) return false;
      return !((val.name === undefined || val.name === null)
        && (val.description === undefined || val.description === null)
        && (val.color === undefined || val.color === null)
        && (val.participants === undefined || val.participants === null)
        && (val.tags === undefined || val.tags === null)
        && (val.repeat === undefined || val.repeat === null)
        && (val.link === undefined || val.link === null));
    }).withMessage('At least one of Name, Description, Color, Participants, Tags, Repeat or Link (if it is an arrangement) is required'),
  body('name').optional().trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
  eventParams.description, eventParams.color, eventParams.participants, eventParams.tags,/* eventParams.repeat,*/ eventParams.link,
  isValid
];

export default {
  create,
  update
};
