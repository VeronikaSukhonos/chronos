import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import Calendars from '../api/calendarsApi.js';
import { TextField } from '../components';
import '../components/SearchForms.css';

const CalendarSearchForm = () => {
  const initSearch = { name: '', author: '' };
  const [search, setSearch] = useState(initSearch);
  const [calendars, setCalendars] = useState([]);

  const [_, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });

  useEffect(() => {
    if ((!search.name || search.name.trim() === '') && (!search.author || search.author.trim() === '')) {
      setLoad(false);
      setFeedback({ msg: '', status: '' });
      setCalendars([]);
      return;
    }

    const wait = setTimeout(() => {
      setLoad(true);
      Calendars.fetchCalendars(`?name=${encodeURIComponent(search.name)}&author=${encodeURIComponent(search.author)}`)
        .then(({data: res}) => {
          setCalendars(res.data.calendars.filter((calendar) => calendar.role === "guest"));
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
        })
        .catch(err => {
          setLoad(false);
          setCalendars([]);
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }, 300);

    return () => clearTimeout(wait);
  }, [search]);

  useEffect(() => {
    return () => setSearch({ name: '', author: '' });
  }, []);

  return (
    <>
      <TextField
        label="Name"
        onChange={(e) => setSearch({...search, name: e.target.value})}
        id="search-name"
        val={search.name}
      />
      <TextField
        label="Author"
        onChange={(e) => setSearch({...search, author: e.target.value})}
        id="search-author"
        val={search.author}
      />
      {feedback.msg && <div className="calendar-search-results">
        <ul className="calendar-search-form">
          {calendars.length > 0 ? calendars.map((calendar) => <li key={calendar.id}>
            <Link to={`/calendars/${calendar.id}`}>
              <div className="searched-event-calendar search-form-result">
                <div className="searched-event-calendar-color" style={{ background: calendar.color || '#ade4ff' }} id={calendar.id}></div>
                {calendar.name} <span>by</span> {calendar.author.login}
              </div>
            </Link>
          </li>) : (feedback.status === 'ok' ? <li className="info-message">No calendars found</li> : <li className="info-message">{feedback.msg}</li>)}
        </ul>
      </div>}
    </>
  );
};

export default CalendarSearchForm;
