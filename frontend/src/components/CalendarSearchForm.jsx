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

  useEffect(() => {
    const wait = setTimeout(() => {
      setLoad(true);
      Calendars.fetchCalendars(`?name=${search.name}&author=${search.author}`)
        .then(({data: res}) => {
          setCalendars(res.data.calendars.filter((calendar) => calendar.role === "guest"));
          setLoad(false);
        })
        .catch(err => {
          setLoad(false);
          setCalendars([]);
        });
    }, 300);
    return () => clearTimeout(wait);
  }), [search];

  useEffect(() => {
    return () => setSearch({ name: '', author: '' });
  }, []);

  return (
    <>
      <TextField
        label="Name"
        onChange={(e) => setSearch({...search, name: e.target.value})}
        id="name"
        val={search.name}
      />
      <TextField
        label="Author"
        onChange={(e) => setSearch({...search, author: e.target.value})}
        id="author"
        val={search.author}
      />
      <div className="calendar-search-results">
        <ul>
          {calendars.length > 0 && calendars.map((calendar) => <li key={calendar.id}>
            <Link to={`/calendars/${calendar.id}`}>
              <div className="searched-event-calendar">
                <div className="searched-event-calendar-color" style={{ background: calendar.color || '#ade4ff' }} id={calendar.id}></div>
                {calendar.name} | Author: {calendar.author.login}
              </div>
            </Link>
          </li>)}
        </ul>
      </div>
    </>
  );
};

export default CalendarSearchForm;
