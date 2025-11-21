import { format } from 'date-fns';

export const fBirthday = (date) => {
  return format(new Date(date), 'd MMMM yyyy');
};
