import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek,
  addMonths, addWeeks, addDays
} from 'date-fns';
import { toast } from 'react-toastify';

import FullCalendarReact from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import Events from '../api/eventsApi.js';
import {
  setCalendar, selectCalendar, selectCalendarLoad, setPeriod, setForm
} from '../store/calendarSlice.js';
import LoadPage from '../pages/LoadPage.jsx';
import ErrorPage from '../pages/ErrorPage.jsx';
import { MainButton, SelectField } from '../components';
import { ArrowIcon, ArrowLeftIcon } from '../assets';
import { fCurrentPeriod } from '../utils/formatDate.js';
import { getEventIcon } from '../utils/getIcon.jsx';
import './Calendar.css';

const Event = ({ event: ev }) => {
  return (
    <div className="calendar-event">
      {getEventIcon(ev.extendedProps.type, "calendar-event-type")}
      <span className="calendar-event-name">{ev.title}</span>
    </div>
  );
};

const Calendar = ({ addToNavigation }) => {
  const calendarRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const setCurrentPeriodByView = (reset = false) => {
    const p = reset ? { year: null, week: null, month: null, day: null } : period;
    const cApi = calendarRef?.current?.getApi();

    const now = new Date();
    const year = p.year || now.getFullYear();
    const sw = p.week ? startOfISOWeek(setISOWeek(new Date(year, 0, 4), p.week)) : null;

    if (view === 'dayGridMonth') {
      const newP = {
        year,
        week: null,
        month: sw?.getMonth() || (p.month !== null ? p.month : null) || now.getMonth(),
        day: null
      };
      dispatch(setPeriod(newP));
      if (!reset) setTimeout(() => cApi?.changeView(view, new Date(newP.year, newP.month, 1)), 0);
    }
    else if (view === 'timeGridWeek') {
      const newP = {
        year,
        week: (p.month !== null && getISOWeek(new Date(p.year, p.month, p.day || 1))) || getISOWeek(now),
        month: null,
        day: null
      };
      dispatch(setPeriod(newP));
      if (!reset) setTimeout(() => cApi?.changeView(view, startOfISOWeek(setISOWeek(new Date(newP.year, 0, 4), newP.week))), 0);
    }
    else if (view === 'timeGridDay') {
      const newP = {
        year,
        week: null,
        month: sw?.getMonth() || (p.month !== null ? p.month : null) || now.getMonth(),
        day: sw?.getDate() || p.day || (p.month !== null ? 1 : null) || now.getDate()
      };
      dispatch(setPeriod(newP));
      if (!reset) setTimeout(() => cApi?.changeView(view, new Date(newP.year, newP.month, newP.day)), 0);
    }

    if (reset) cApi?.today();
  };

  const addToCurrentPeriod = (add = true) => {
    const ny = new Date().getFullYear(), max = 50;
    const msg = `Supported year range is ±${max} years from the current year`;

    if (view === 'dayGridMonth') {
      const newD = addMonths(new Date(period.year, period.month, 1), add ? 1 : -1);
      if (newD.getFullYear() >= ny - max && newD.getFullYear() <= ny + max)
        dispatch(setPeriod({ year: newD.getFullYear(), week: null, month: newD.getMonth(), day: null }));
      else toast(msg);
    } else if (view === 'timeGridWeek') {
      const newD = addWeeks((setISOWeek(new Date(period.year, 0, 4), period.week)), add ? 1 : -1);
      if (getISOWeekYear(newD) >= ny - max && getISOWeekYear(newD) <= ny + max)
        dispatch(setPeriod({ year: getISOWeekYear(newD), week: getISOWeek(newD), month: null, day: null }));
      else toast(msg);
    } else if (view === 'timeGridDay') {
      const newD = addDays(new Date(period.year, period.month, period.day), add ? 1 : -1);
      if (newD.getFullYear() >= ny - max && newD.getFullYear() <= ny + max)
        dispatch(setPeriod({ year: newD.getFullYear(), week: null, month: newD.getMonth(), day: newD.getDate() }));
      else toast(msg);
    }
    if (add) calendarRef?.current?.getApi().next();
    else calendarRef?.current?.getApi().prev();
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
      const cs = myCalendars.concat(otherCalendars).filter(c => c.visible).map(c => c.id);
      const ets = eventTypes.filter(et => et.visible).map(et => et.type);
      const ts = tags.filter(t => t.visible).map(t => t.id);

      dispatch(setCalendar({ eventsLoad: true }));
      Events.fetchEvents({
        ...(cs.length && { calendar: cs }),
        ...(ets.length && { type: ets }),
        ...(ts.length && { tag: ts }),
        ...Object.fromEntries((Object.entries(period).filter(e => e[1] !== null)))
      })
        .then(({ data: res }) => {
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

  useEffect(() => {
    const cApi = calendarRef?.current?.getApi();

    setTimeout(() => {
      cApi?.getEvents().forEach(ev => { ev.remove(); });
      events.forEach(ev => cApi?.addEvent({
        id: ev.repeat ? (ev.id + ev.startDate) : ev.id,
        groupId: ev.id,
        title: ev.name,
        start: ev.startDate, end: ev.endDate, allDay: ev.allDay,
        color: ev.color || '#ade4ff',
        editable: ev.type !== 'holiday',
        extendedProps: {
          calendarId: ev.calendarId,
          authorId: ev.author?.id,
          type: ev.type,
          tags: ev.tags,
          visibleForAll: ev.visibleForAll,
          repeat: ev.repeat,
          link: ev.link,
          doneDate: ev.doneDate
        }
      }));
    }, 0);
  }, [events]);

  return (
    <div className="calendar">
      <div className={"calendar-navigation" + (addToNavigation ? " add" : "")}>
        {addToNavigation}
        <SelectField
          name="view"
          options={[
            { label: 'Day', value: 'timeGridDay' },
            { label: 'Week', value: 'timeGridWeek' },
            { label: 'Month', value: 'dayGridMonth' }
          ]}
          selected={view}
          onChange={(e) => { dispatch(setCalendar({ view: e.target.value })) }}
          nav={true} dis={vsLoad}
        />
        <div className="calendar-navigation-current">
          <div>{fCurrentPeriod(period)} {view === 'timeGridWeek' && <span>{`(week ${period.week})`}</span>}</div>
        </div>
        <MainButton
          title="Now" type="button" short={true} nav={true}
          onClick={() => setCurrentPeriodByView(true)} dis={vsLoad}
        />
        <MainButton
          title={<ArrowLeftIcon />} type="button" square={true} nav={true}
          onClick={() => addToCurrentPeriod(false)} dis={vsLoad}
        />
        <MainButton
          title={<ArrowIcon />} type="button" square={true} nav={true}
          onClick={() => addToCurrentPeriod()} dis={vsLoad}
        />
      </div>
      <div className={`calendar-container ${view}` + (eventsLoad ? " disabled" : "")
        + ((feedback === null || feedback?.status === 'fail') ? " white" : "")}>
        {feedback === null ? <LoadPage />
        : (feedback?.status === 'fail' ? <ErrorPage error={feedback?.msg} />
        : <FullCalendarReact ref={calendarRef}
            plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
            headerToolbar={false}
            initialDate={new Date()} initialView={view} initialEvents={events}
            height="100%"
            weekNumberCalculation="ISO"
            views={{
              timeGridDay: {
                dayHeaderFormat: { weekday: 'long' },
                weekNumbers: true, weekNumberFormat: { week: 'numeric' }
              },
              timeGridWeek: {
                dayHeaderFormat: { day: 'numeric', weekday: 'short' }
              },
              dayGridMonth: {
                dayHeaderFormat: { weekday: 'short' },
                weekNumbers: true, weekNumberFormat: { week: 'numeric' }
              }
            }}
            eventContent={Event}
            fixedWeekCount={false}
            showNonCurrentDates={false}
            slotDuration="01:00:00"
            slotLabelFormat={{ hour: 'numeric', hour12: false }}
            nowIndicator={true}
            nowIndicatorClassNames="now-indicator"
            windowResizeDelay={10}
            dateClick={function(i) {
              dispatch(setForm({ form: 'eventCreateForm', params: { open: true, event: { startDate: i.dateStr }}}));
            }}
            eventClick={function(i) {
              if (i.event.extendedProps.type !== 'holiday')
                navigate(`/events/${i.event.groupId}`);
            }}
            displayEventTime={false}
          />)}
      </div>
    </div>
  );
};

export default Calendar;
