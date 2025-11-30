import {
  ArchiveIcon, GlobeIcon, ProfileIcon, EyeOpenIcon,
  ArrangementIcon, TaskIcon, ReminderIcon, HolidayIcon, BirthdayIcon
} from '../assets';

export const getCalendarIcon = (c, cl) => {
  return <>
    {c.isHidden && <ArchiveIcon className={cl} />}
    {c.isPublic && <GlobeIcon className={cl} />}
    {c.role === 'participant' ? <ProfileIcon className={cl} />
    : (c.role === 'follower' ? <EyeOpenIcon className={cl} /> : <></>)}
  </>
};

export const getEventIcon = (e, cl) => {
  return e === 'arrangement' ? <ArrangementIcon className={cl} />
    : e === 'task' ? <TaskIcon className={cl} />
    : e === 'reminder' ? <ReminderIcon className={cl} />
    : e === 'holiday' ? <HolidayIcon className={cl} />
    : e === 'birthday' ? <BirthdayIcon className={cl} /> : <></>
};
