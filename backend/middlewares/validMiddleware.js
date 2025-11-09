import { validationResult } from 'express-validator';

const isValid = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed', errors: result.array().map(err => { 
        return { ...(err.path && { param: err.path }), error: err.msg };
      })
    });
  }
  next();
};

export default isValid;
