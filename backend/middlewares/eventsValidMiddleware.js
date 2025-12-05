import { body } from 'express-validator';

import isValid from './validMiddleware.js';

const get = [
  body('calendar').optional()
    .custom((value) => {
      if (typeof value !== 'string' && !(value instanceof Array && value.every(item => typeof item === 'string')))
        throw new Error('Calendars must be provided as single Id string or array of Id strings');
      return true;
    })
    .customSanitizer(value => typeof value === 'string' ? value.trim():value.map(el => el.trim())),
  body('type').optional()
    .custom((value) => {
      if (typeof value !== 'string' && !(value instanceof Array && value.every(item => typeof item === 'string')))
        throw new Error('Types must be provided as single string or array of strings');
      return true;
    })
    .customSanitizer(value => typeof value === 'string' ? value.trim():value.map(el => el.trim())),
  body('tag').optional()
    .custom((value) => {
      if (typeof value !== 'string' && !(value instanceof Array && value.every(item => typeof item === 'string')))
        throw new Error('Tags must be provided as single Id string or array of Id strings');
      return true;
    })
    .customSanitizer(value => typeof value === 'string' ? value.trim():value.map(el => el.trim())),
  body('country').optional()
    .isISO31661Alpha2().withMessage('Country must be a valid ISO 3166-1 alpha-2 country code'),
  body('year').optional()
    .isInt().withMessage('Year must be an integer').bail()
    .toInt()
    .isInt({ min: new Date().getUTCFullYear() - 50, max: new Date().getUTCFullYear() + 50 })
    .withMessage('Year must be greater than current year - 50 and less than current year + 50'),
  body('month').optional()
    .isInt().withMessage('Month must be an integer').bail()
    .toInt()
    .isInt({ min: 0 }).withMessage('Month must be a not-negative number'),
  body('week').optional()
    .isInt().withMessage('Week must be an integer').bail()
    .toInt()
    .isInt({ gt: 0 }).withMessage('Week must be a positive number'),
  body('day').optional()
    .isInt().withMessage('Day must be an integer').bail()
    .toInt()
    .isInt({ gt: 0 }).withMessage('Day must be a positive number'),
  body('search').optional().trim()
    .isString().withMessage('Search must be a string'),
  body('limit').if((value, { req }) => req.body.search !== undefined).optional()
    .customSanitizer(value => {
      let check = Array.isArray(value) ? value[0]:value;
      return check == undefined ? check:(isNaN(check) ? 0:Math.abs(parseInt(check)));
    }),
  isValid
]

const eventParams = {
  name: body('name').trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
  type: body('type').trim().toLowerCase()
    .notEmpty().withMessage('Type is required').bail()
    .isIn(["arrangement", "reminder", "task", "holiday", "birthday"])
    .withMessage("Type can be 'arrangement', 'reminder', 'task', 'holiday' or 'birthday'"),
  startDate: body('startDate').trim()
    .notEmpty().withMessage('Start Date is required').bail()
    .isISO8601({strict: true}).withMessage('Start Date must be a valid date').bail()
    .custom((val) => new Date(val) > Date.now()).withMessage('Start Date must be in the future'),
  description: body('description').optional().trim()
    .isLength({ max: 250 }).withMessage('Description must be at most 250 characters'),
  color: body('color').optional().trim()
    .matches(/^#[A-Fa-f\d]{6}$/).withMessage('Color must be in hex format'),
  participants: body('participants').optional()
    .isArray().withMessage('Participants must be provided as array').bail()
    .custom((value) => {
      if (value.length > 0 && !value.every(item => typeof item === 'string'))
        throw new Error('Participants array must contain only Ids as strings');
      return true;
    })
    .customSanitizer(value => typeof value === 'string' ? value.trim():value.map(el => el.trim())),
  tags: body('tags').optional()
    .isArray().withMessage('Tags must be provided as array')
    .customSanitizer(value => value.map(el => el.trim())),
  visibleForAll: body('isPublic').optional().customSanitizer(val => val === true || val === 'true'),
  endDate: body('endDate').if(body('type').isIn(['arrangement', 'task'])).optional({ checkFalsy: true }).trim()
    .isISO8601({strict: true}).withMessage('End Date must be a valid date').bail()
    .custom((val, { req }) => new Date(val) > new Date(req.body.startDate))
    .withMessage('End Date must be in the future compared to Start Date'),
  repeat: body('repeat').if(body('type').isIn(['arrangement', 'reminder'])).optional()
    .isObject().withMessage('Repeat must be an object').bail()
    .custom((value, { req }) => {
      if (value.frequency === undefined || value.parameter === undefined)
        throw new Error("Repeat object must contain 'frequency' and 'parameter' fields");
      else if (typeof value.frequency != 'string' || !['year', 'month', 'week', 'day'].includes(value.frequency))
        throw new Error("Repeat frequency can be 'year', 'month', 'week' or 'day'");
      else if (typeof value.parameter != 'number' || value.parameter <= 0)
        throw new Error('Repeat parameter must be a positive number');
      if (req.body.type == 'arrangement') {
        const timeDelta = new Date(req.body.endDate) - new Date(req.body.startDate);
        let repetitionTime = 86400000 * value.parameter;
        if (value.frequency === 'week')
          repetitionTime *= 7;
        else if (value.frequency === 'month')
          repetitionTime *= 30
        else if (value.frequency === 'year')
          repetitionTime *= 365;
        if (timeDelta >= repetitionTime)
          throw new Error('Repeat period must be longer that event duration');
      }
      return true;
    }),
  link: body('link').if(body('type').equals('arrangement')).optional().trim()
    .isURL().withMessage('Link must be an URL')
};

const create = [
  eventParams.name, eventParams.type, eventParams.startDate,
  eventParams.description, eventParams.color, eventParams.participants, eventParams.tags, eventParams.visibleForAll,
  eventParams.endDate, eventParams.repeat, eventParams.link,
  isValid
];

const update = [
  body()
    .custom((val) => {
      if (!val) return false;
      return !((val.name === undefined || val.name === null)
        && (val.description === undefined || val.description === null)
        && (val.startDate === undefined || val.startDate === null)
        && (val.endDate === undefined || val.endDate === null)
        && (val.color === undefined || val.color === null)
        && (val.participants === undefined || val.participants === null)
        && (val.tags === undefined || val.tags === null)
        && (val.visibleForAll === undefined || val.visibleForAll === null)
        && (val.repeat === undefined || val.repeat === null)
        && (val.link === undefined || val.link === null));
    }).withMessage('At least one of name, description, start date, end date (if it is arrangement or task), color, participants, tags, visibility, repeat (if it is not a task) or link (if it is an arrangement) is required'),
  body('name').optional().trim()
    .notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
  body('startDate').optional({ checkFalsy: true }).trim()
    .isISO8601({strict: true}).withMessage('Start date must be a valid date').bail()
    .custom((val) => new Date(val) > Date.now()).withMessage('Start date must be in the future'),
  body('endDate').optional({ checkFalsy: true }).trim()
    .isISO8601({strict: true}).withMessage('End date must be a valid date'),
  body('repeat').optional()
    .isObject().withMessage('Repeat must be an object').bail()
    .custom((value, { req }) => {
      if (value.frequency === undefined || value.parameter === undefined)
        throw new Error("Repeat object must contain 'frequency' and 'parameter' fields");
      else if (typeof value.frequency != 'string' || !['year', 'month', 'week', 'day'].includes(value.frequency))
        throw new Error("Repeat frequency can be 'year', 'month', 'week' or 'day'");
      else if (typeof value.parameter != 'number' || value.parameter <= 0)
        throw new Error('Repeat parameter must be a positive number');
      return true;
    }),
  eventParams.description, eventParams.color, eventParams.participants,
  eventParams.tags, eventParams.visibleForAll, eventParams.link,
  isValid
];

export default {
  get,
  create,
  update
};
