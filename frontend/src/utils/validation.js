import validator from 'validator';

const login = (params) => {
  const val = (params.login || '').trim().toLowerCase();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Login is required';
  else if (!validator.isAlphanumeric(val))
    err = 'Login must contain only letters and digits';
  else if (!/^[a-z]/.test(val))
    err = 'Login must start with a letter';
  else if (!validator.isLength(val, { min: 3, max: 30 }))
    err = 'Login must be 3-30 characters';

  return err;
};

const email = (params) => {
  const val = (params.email || '').trim();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Email is required';
  else if (!validator.isEmail(val))
    err = 'Email must be valid';
  else if (!validator.isLength(val, { max: 100 }))
    err = 'Email must be at most 100 characters';

  return err;
};

const password = (params) => {
  const val = (params.password || '').trim();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Password is required';
  else if (!validator.isStrongPassword(val, {
    minLength: 8, maxLength: 30, minLowercase: 1,
    minUppercase: 1, minNumbers: 1, minSymbols: 0,
  }))
    err = 'Password must be 8-30 characters, with at least one A-Z, one a-z and one 0-9';

  return err;
};

const passwordConfirmation = (params) => {
  const val = (params.passwordConfirmation || '').trim();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Password Confirmation is required';
  else if ((params.password || '').trim() !== val)
    err = 'Password Confirmation must match Password';

  return err;
};

export default {
  login, email, password, passwordConfirmation
};
