import {
  format as fmt, differenceInHours,
  setISOWeek, startOfISOWeek, endOfISOWeek
} from 'date-fns';

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

export const fDate = (date) => {
  const dateObj = new Date(date);

  return fmt(dateObj, 'd MMM yyyy HH:mm');
};

export const fCurrentPeriod = (period) => {
  const { year, week, month, day } = period;

  if (day !== null) {
    const d = new Date(year, month, day);
    return fmt(d, 'd MMMM yyyy');
  } else if (month !== null) {
    const d = new Date(year, month, 1);
    return fmt(d, 'MMMM yyyy');
  } else if (week !== null) {
    const d = setISOWeek(new Date(year, 0, 4), week);
    const sw = startOfISOWeek(d), ew = endOfISOWeek(d);
    return `${(sw.getFullYear() === ew.getFullYear()) ? fmt(sw, 'd MMM') : fmt(sw, 'd MMM yyyy')} - ${fmt(ew, 'd MMM yyyy')}`;
  }
};
