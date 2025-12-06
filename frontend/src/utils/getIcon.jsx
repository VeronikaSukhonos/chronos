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

export const getEventIcon = (etype, cl) => {
  return etype === 'arrangement' ? <ArrangementIcon className={cl} />
    : etype === 'task' ? <TaskIcon className={cl} />
    : etype === 'reminder' ? <ReminderIcon className={cl} />
    : etype === 'holiday' ? <HolidayIcon className={cl} />
    : etype === 'birthday' ? <BirthdayIcon className={cl} /> : <></>
};

export const getPublicEventIcon = (visibleForAll, cl) => {
  return visibleForAll ? <GlobeIcon className={cl} /> : <></>
};
