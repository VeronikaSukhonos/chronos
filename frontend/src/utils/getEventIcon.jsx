import {
  ArrangementIcon, TaskIcon, ReminderIcon, HolidayIcon, BirthdayIcon
} from '../assets';

export const getEventIcon = (e, cl) => {
  return e === 'arrangement' ? <ArrangementIcon className={cl} />
    : e === 'task' ? <TaskIcon className={cl} />
    : e === 'reminder' ? <ReminderIcon className={cl} />
    : e === 'holiday' ? <HolidayIcon className={cl} />
    : e === 'birthday' ? <BirthdayIcon className={cl} /> : <></>
};
