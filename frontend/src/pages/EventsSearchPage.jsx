import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';

import Events from '../api/eventsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { getEventIcon, getPublicEventIcon } from '../utils/getIcon.jsx';
import { fEventDate } from '../utils/formatDate.js';
import './ContentPage.css';
import './EventPage.css';
import '../components/Forms.css';
import '../components/SearchForms.css';

const EventPreview = ({ event }) => {
  return (
    <div className="content-info-container">
      <div className="content-name-container">
        <Link className="event-title" to={`/events/${event.id}`}>
          <h1 className="content-name event-title" style={{ background: event.color || '#ade4ff' }}>
            {getEventIcon(event.type, "content-meta-icon event-icon")}
            {event.name}
          </h1>
          {getPublicEventIcon(event.visibleForAll, "content-meta-icon")}
        </Link>
        <div className="content-meta">
          <div className="searched-event-date">
            {event.repeat && `each ${event.repeat.parameter} ${event.repeat.frequency}${event.repeat.parameter > 1 ? 's' : ''} since ` }
            {fEventDate(event.type, event.startDate, event.endDate, event.allDay)}
          </div>
        </div>
      </div>
      <Link to={`/calendars/${event.calendar?.id}`}>
        <div className="searched-event-calendar">
          <div className="searched-event-calendar-color" style={{ background: event.calendar?.color || '#ade4ff' }}></div>
          {event.calendar?.name}
        </div>
      </Link>
      <div className="content-description">{event.description}</div>
      <ul className="tags">
        {event.tags.length > 0 && event.tags.map((tag) => <li key={tag} className="content-name tag">{tag}</li>)}
      </ul>
    </div>
  );
};

const EventsSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');

  const auth = useSelector(selectAuthUser.user);
  const [events, setEvents] = useState([]);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });

  useEffect(() => {
    if (!search || !search.trim())
      navigate("/");
    Events.fetchEvents({ search: search.trim() })
      .then(({ data: res }) => {
        setEvents(res.data.events);
        setInitLoad(false);
        setInitFeedback({ msg: res.message, status: 'ok' });
      })
      .catch((err) => {
        setInitLoad(false);
        setInitFeedback({ msg: err.message, status: 'fail' });
      });
  }, [search]);

  if (!auth) return <Navigate to="/login" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} />

  return (
    <div className="horizontal center-container">
      <h1 className="basic-form-title">Results for "{search}"</h1>

      {events.length < 1
        ? <div className="info-message">No events found</div>
        : <div className="content-container events-container">{events.map(e => <EventPreview key={e.id} event={e} />)}</div>}
    </div>
  );
};

export default EventsSearchPage;
