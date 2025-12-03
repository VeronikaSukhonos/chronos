import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek,
  addMonths, addWeeks, addDays,
  endOfMonth, endOfISOWeek, eachDayOfInterval
} from 'date-fns';

import Events from '../api/eventsApi.js';
import {
  setCalendar, selectCalendar, selectCalendarLoad, setPeriod
} from '../store/calendarSlice.js';
import LoadPage from '../pages/LoadPage.jsx';
import ErrorPage from '../pages/ErrorPage.jsx';
import { MainButton, SelectField } from '../components';
import { ArrowIcon, ArrowLeftIcon } from '../assets';
import { fCurrentPeriod } from '../utils/formatDate.js';
import './Calendar.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Calendar = ({ addToNavigation }) => {
  const dispatch = useDispatch();

  const myCalendars = useSelector(selectCalendar.myCalendars);
  const otherCalendars = useSelector(selectCalendar.otherCalendars);
  const eventTypes = useSelector(selectCalendar.eventTypes);
  const tags = useSelector(selectCalendar.tags);

  const period = useSelector(selectCalendar.period);
  const view = useSelector(selectCalendar.view);
  const events = useSelector(selectCalendar.events);

  const vsLoad = useSelector(selectCalendarLoad.vs);
  const eventsLoad = useSelector(selectCalendarLoad.events);
  const [feedback, setFeedback] = useState(null);

  const [nowDate, setNowDate] = useState(new Date());
  const [monthDaysToDisplay, setMonthDaysToDisplay] = useState([]);
  const [weekDaysToDisplay, setWeekDaysToDisplay] = useState([]);
  const [dayDayToDisplay, setDayDayToDisplay] = useState(null);
  const [swapLeft, setSwapLeft] = useState(false);
  const [swapRight, setSwapRight] = useState(false);

  const setCurrentPeriodByView = (reset = false) => {
    const p = reset ? { year: null, week: null, month: null, day: null } : period;

    const now = new Date();
    const year = p.year || now.getFullYear();
    const sw = p.week ? startOfISOWeek(setISOWeek(new Date(year, 0, 4), p.week)) : null;

    if (view === 'month')
      dispatch(setPeriod({
        year,
        week: null,
        month: sw?.getMonth() || p.month || now.getMonth(),
        day: null
      }));
    else if (view === 'week')
      dispatch(setPeriod({
        year,
        week: (p.month && getISOWeek(new Date(p.year, p.month, p.day || 1))) || getISOWeek(now),
        month: null,
        day: null
      }));
    else if (view === 'day')
      dispatch(setPeriod({
        year,
        week: null,
        month: sw?.getMonth() || p.month || now.getMonth(),
        day: sw?.getDate() || p.day || (p.month ? 1 : null) || now.getDate()
      }));
  };

  const addToCurrentPeriod = (add = true) => {
    if (view === 'month') {
      const newD = addMonths(new Date(period.year, period.month, 1), add ? 1 : -1);
      dispatch(setPeriod({ year: newD.getFullYear(), week: null, month: newD.getMonth(), day: null }));
    } else if (view === 'week') {
      const newD = addWeeks((setISOWeek(new Date(period.year, 0, 4), period.week)), add ? 1 : -1);
      dispatch(setPeriod({ year: getISOWeekYear(newD), week: getISOWeek(newD), month: null, day: null }));
    } else if (view === 'day') {
      const newD = addDays(new Date(period.year, period.month, period.day), add ? 1 : -1);
      dispatch(setPeriod({ year: newD.getFullYear(), week: null, month: newD.getMonth(), day: newD.getDate() }));
    }
  };

  useEffect(() => {
    setCurrentPeriodByView();
    return () => dispatch(setCalendar());
  }, []);

  useEffect(() => {
    setCurrentPeriodByView();
  }, [view]);

  useEffect(() => {
    if (vsLoad || !period.year) {
      dispatch(setCalendar({ eventsLoad: false }));
      return;
    }

    const wait = setTimeout(() => {
      setNowDate(new Date());
      dispatch(setCalendar({ eventsLoad: true }));
      Events.fetchEvents({
        calendars: myCalendars.concat(otherCalendars).map(c => c.id),
        types: eventTypes.map(et => et.type),
        tags: tags.map(et => et.name),
        ...Object.fromEntries((Object.entries(period).filter(e => e[1] !== null)))
      })
        .then(({ data: res }) => {
          if (view === 'month') {
            const fd = new Date(period.year, period.month, 1), ld = endOfMonth(fd);
            setMonthDaysToDisplay(eachDayOfInterval({ start: startOfISOWeek(fd), end: endOfISOWeek(ld) }));
          } else if (view === 'week') {
            const w = setISOWeek(new Date(period.year, 0, 4), period.week);
            setWeekDaysToDisplay(eachDayOfInterval({ start: startOfISOWeek(w), end: endOfISOWeek(w) }));
          } else if (view === 'day')
            setDayDayToDisplay();
          dispatch(setCalendar({ events: res.data.events, eventsLoad: false }));
          setFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          dispatch(setCalendar({ events: [], eventsLoad: false }));
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }, 300);

    return () => clearTimeout(wait);
  }, [vsLoad, myCalendars, otherCalendars, eventTypes, tags, period, view]);

  const monthCalendar = <>
    <div className="calendar-weekdays-line-container month">
      <div className="calendar-weekday-no-content"></div>
      <div className="calendar-weekdays-line">
        {WEEKDAYS.map((d, i) => <div key={i} className="calendar-weekday">{d}</div>)}
      </div>
    </div>
    <div className="calendar-days-grid-container">
      <div className="calendar-week-numbers-column">
        {[...new Set(monthDaysToDisplay.map(d => getISOWeek(d)))]
          .map((w, i) => <div key={i} className="calendar-week-number">{w}</div>)}
      </div>
      <div className="calendar-days-grid">
        {monthDaysToDisplay.map((d, i) => <div key={i} className="calendar-day">
          <div className="calendar-day-header">
            <span className={(d.getFullYear() === nowDate.getFullYear() && d.getMonth() === nowDate.getMonth()
              && d.getDate() === nowDate.getDate()) ? "calendar-day-today" : ""}>{d.getDate()}
            </span>
          </div>
          <div className="calendar-day-events-container">

          </div>
        </div>)}
      </div>
    </div>
  </>

  const weekCalendar = <>
    <div className="calendar-weekdays-line-container week">
      <div className="calendar-weekday-no-content"></div>
      <div className="calendar-weekdays-line">
        {weekDaysToDisplay.map((d, i) => <div key={i} className="calendar-day-header">
            <span className={(d.getFullYear() === nowDate.getFullYear() && d.getMonth() === nowDate.getMonth()
              && d.getDate() === nowDate.getDate()) ? "calendar-day-today" : ""}>
                {d.getDate()}, {WEEKDAYS[i]}
            </span>
          </div>)}
      </div>
    </div>
    <div className="calendar-hours-days-grid-container">
      <div className="calendar-hour-numbers-column">
        {Array.from({ length: 24 }, (_, i) => i)
          .map((h, i) => <div key={i} className="calendar-hour-number">{h}</div>)}
      </div>
      <div className="calendar-days-grid">
        {weekDaysToDisplay.map((d, i) => <div key={i} className="calendar-day">
          <div className="calendar-day-events-container">

          </div>
        </div>)}
      </div>
    </div>
  </>

  const dayCalendar = <>

  </>

  return (
    <div className="calendar">
      <div className={"calendar-navigation" + (addToNavigation ? " add" : "")}>
        {addToNavigation}
        <SelectField
          name="view"
          options={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' }
          ]}
          selected={view}
          onChange={(e) => { dispatch(setCalendar({ view: e.target.value })) }}
          nav={true}
        />
        <div className="calendar-navigation-current">
          <div>{fCurrentPeriod(period)} {view === 'week' && <span>{`(week ${period.week})`}</span>}</div>
        </div>
        <MainButton
          title="Now" type="button" short={true} nav={true}
          onClick={() => setCurrentPeriodByView(true)}
        />
        <MainButton
          title={<ArrowLeftIcon />} type="button" square={true} nav={true}
          onClick={() => addToCurrentPeriod(false)}
        />
        <MainButton
          title={<ArrowIcon />} type="button" square={true} nav={true}
          onClick={() => addToCurrentPeriod()}
        />
      </div>
      <div className={`calendar-container ${view}` + (eventsLoad ? " disabled" : "")
        + (feedback === null ? " start" : "")}>
        {feedback?.status === 'fail' ? <ErrorPage error={feedback?.msg} />
        : (feedback === null ? <LoadPage />
        : (view === 'month' ? monthCalendar
        : (view === 'week' ? weekCalendar
        : (view === 'day' ? dayCalendar : 'Invalid view'))))}
      </div>
    </div>
  );
};

export default Calendar;
