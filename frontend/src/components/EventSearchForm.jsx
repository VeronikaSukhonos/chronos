import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

import Events from '../api/eventsApi.js';
import { SearchIcon } from '../assets';
import { fEventDate } from '../utils/formatDate.js';
import { getEventIcon } from '../utils/getIcon.jsx';
import './SearchForms.css';
import './InputFields.css';

const SearchedEvent = ({ event }) => {
  return (
    <Link className="searched-event" to={`events/${event.id}`}>
      <div className="searched-event-title">
        <div className="searched-event-name" style={{ background: event.color }}>
          { getEventIcon(event.type, "searched-event-type") }{event.name}
        </div>
      </div>
      <div className="searched-event-calendar">
        <div className="searched-event-calendar-color" style={{ background: event.calendar?.color }}></div>
        {event.calendar?.name}
      </div>
      <div className="searched-event-date">
        {event.repeat && `each ${event.repeat.parameter} ${event.repeat.frequency}${event.repeat.parameter > 1 ? 's' : ''} from ` }
        {fEventDate(event.type, event.startDate, event.endDate, event.allDay)}
      </div>
    </Link>
  )
};

const EventSearchForm = ({ label, id, onSubmit, search, setSearch, searchOpen, setSearchOpen }) => {
  const [_, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [events, setEvents] = useState([]);

  const inputRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!search || search.trim() === '') {
      setLoad(false);
      setFeedback({ msg: '', status: '' });
      setEvents([]);
      return;
    }

    const wait = setTimeout(() => {
      setLoad(true);
      setFeedback({ msg: '', status: '' });
      Events.fetchEvents({ search: search.trim(), limit: 10 })
        .then(({ data: res }) => {
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
          setEvents(res.data.events);
        })
        .catch(err => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
          setEvents([]);
        });
    }, 300);

    return () => clearTimeout(wait);
  }, [search]);

  useEffect(() => {
    return () => setSearch('');
  }, []);

  return (
    <div className={"event-search-form-container " + (searchOpen ? "open" : "close")}>
      <form className="field" onSubmit={onSubmit}>
        {label && <label className="field-label" htmlFor={id}>{label}</label>}
        <div className="field-container lighter match-height">
          <input ref={inputRef}
            type="text"
            id={id} name={id}
            onChange={(e) => setSearch(e.target.value)} value={search || ""}
            onBlur={() => {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = setTimeout(() => {
                if (searchOpen) setSearchOpen(false);
                setEvents([]);
                setFeedback({ msg: '', status: '' });
              }, 150);
            }}
            placeholder="Search events..." autoComplete="off"
          />
          <button className="search-button" type="submit"><SearchIcon /></button>
        </div>
      </form>
      {
        feedback.msg && <ul className="search-results">
        {
          events.length > 0
            ? <>{events.map(e => <li key={`searchedevent${e.id}`}><SearchedEvent event={e} /></li>)}</>
            : <li className="info-message">{feedback.status === 'ok' ? 'No events found' : feedback.msg}</li>
        }
        </ul>
      }
    </div>
  );
};

export default EventSearchForm;
