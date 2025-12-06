import validator from 'validator';

const cmpDays = (d1, d2, sign = '=') => {
  if (sign === '<')
    return d1?.getFullYear() < d2?.getFullYear()
      && d1?.getMonth() < d2?.getMonth() && d1?.getDate() < d2?.getDate();
  else if (sign === '>')
    return d1?.getFullYear() > d2?.getFullYear()
      && d1?.getMonth() > d2?.getMonth() && d1?.getDate() > d2?.getDate();
  return d1?.getFullYear() === d2?.getFullYear()
    && d1?.getMonth() === d2?.getMonth() && d1?.getDate() === d2?.getDate();
};

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
    err = 'Password confirmation is required';
  else if ((params.password || '').trim() !== val)
    err = 'Password confirmation must match Password';

  return err;
};

const fullName = (params) => {
  const val = (params.fullName || '').trim();
  let err = '';

  if (!validator.matches(val, /^[A-Za-z\s]*$/))
    err = 'Full name must contain only letters and spaces';
  else if (!validator.isLength(val, { max: 60 }))
    err = 'Full name must be at most 60 characters';

  return err;
};

const dob = (params) => {
  const val = (params.dob || '').toString().trim().toLowerCase();
  let err = '';

  if (validator.isISO8601(val))
    err = 'Date of birth must be a valid date';
  else if (cmpDays(new Date(val), new Date(), '>'))
    err = 'Date of birth must not be in the future';

  return err;
};

const tagTitle = (params) => {
  const val = (params.title || '').trim();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Title is required';
  else if (!validator.isLength(val, { max: 30 }))
    err = 'Title must be at most 30 characters';

  return err;
};

const calendarName = (params) => {
  const val = (params.name || '').trim();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Name is required';
  else if (!validator.isLength(val, { max: 30 }))
    err = 'Name must be at most 30 characters';

  return err;
};

const calendarDescription = (params) => {
  const val = (params.description || '').trim();
  let err = '';

  if (!validator.isLength(val, { max: 250 }))
    err = 'Description must be at most 250 characters';

  return err;
};

const startDate = (params) => {
  const val = (params.startDate || '').toString().trim().toLowerCase();
  let err = '';

  if (validator.isEmpty(val))
    err = 'Start date is required';
  if (validator.isISO8601(val))
    err = 'Start date must be a valid date';
  else if ((new Date(val) < new Date()) && params.type !== 'birthday' && !params.allDay)
    err = 'Start date must be in the future';

  return err;
};

const endDate = (params) => {
  const val = (params.endDate || '').toString().trim().toLowerCase();
  let err = '';

  if (validator.isISO8601(val))
    err = 'End date must be a valid date';
  else if (val && !(new Date(val) > new Date(params.startDate)))
    err = 'End date must be later than start date';

  return err;
};

const arrangementLink = (params) => {
  const val = (params.link || '').toString().trim().toLowerCase();
  let err = '';

  if (val && !validator.isURL(val))
    err = 'Link must be a URL';

  return err;
};

export default {
  login, email, password, passwordConfirmation, fullName, dob,
  calendarName, calendarDescription,
  cmpDays, startDate, endDate, arrangementLink,
  tagTitle
};
