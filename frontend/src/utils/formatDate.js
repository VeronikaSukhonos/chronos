import { format as fmt, differenceInHours } from 'date-fns';

export const fBirthday = (date) => {
  return fmt(new Date(date), 'd MMMM yyyy');
};

export const fEventDate = (type, startDate, endDate, allDay) => {
  const sd = new Date(startDate), ed = new Date(endDate);

  if (type !== 'arrangement')
    return allDay ? fmt(sd, 'd MMM yyyy') : fmt(sd, 'd MMM yyyy HH:mm');
  else
    return [
      fmt(sd, 'd MMM yyyy HH:mm'), ' - ', ((Math.abs(differenceInHours(sd, ed)) < 24)
        ? fmt(ed, 'HH:mm') : fmt(ed, 'd MMM yyyy HH:mm'))
      ];
};
