import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Events from '../api/eventsApi.js';
import {
  setCalendar, selectCalendar, selectCalendarLoad
} from '../store/calendarSlice.js';
import LoadPage from '../pages/LoadPage.jsx';
import ErrorPage from '../pages/ErrorPage.jsx';
import { MainButton, SelectField } from '../components';
import { ArrowIcon, ArrowLeftIcon } from '../assets';
import './Calendar.css';

const Calendar = ({ addToNavigation }) => {
  const dispatch = useDispatch();

  const myCalendars = useSelector(selectCalendar.myCalendars);
  const otherCalendars = useSelector(selectCalendar.otherCalendars);
  const eventTypes = useSelector(selectCalendar.eventTypes);
  const tags = useSelector(selectCalendar.tags);

  const view = useSelector(selectCalendar.view);
  // const date TODO

  const vsLoad = useSelector(selectCalendarLoad.vs);
  const eventsLoad = useSelector(selectCalendarLoad.events);

  const [feedback, setFeedback] = useState({ msg: '', status: '' });

  useEffect(() => {
    if (!vsLoad) {
      dispatch(setCalendar({ eventsLoad: true }));
      Events.fetchEvents([]) // TODO
        .then(({ data: res }) => {
          dispatch(setCalendar({ events: res.data.events, eventsLoad: false }));
          setFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          dispatch(setCalendar({ eventsLoad: false }));
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, [vsLoad, myCalendars, otherCalendars, eventTypes, tags, view]); // TODO date

  const calendar = <>calendar</>

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
        <div className="calendar-navigation-current">{"November 2025"}</div>
        <MainButton
          title="Now" type="button" short={true} nav={true}
          onClick={() => {}}
        />
        <MainButton
          title={<ArrowLeftIcon />} type="button" square={true} nav={true}
          onClick={() => {}}
        />
        <MainButton
          title={<ArrowIcon />} type="button" square={true} nav={true}
          onClick={() => {}}
        />
      </div>
      <div className={"calendar-container" + (eventsLoad ? " disabled" : "")}>
        {feedback.status === 'fail' ? <ErrorPage error={feedback.msg} />
        : ((vsLoad && eventsLoad) ? <LoadPage /> : calendar)}
      </div>
    </div>
  );
};

export default Calendar;
