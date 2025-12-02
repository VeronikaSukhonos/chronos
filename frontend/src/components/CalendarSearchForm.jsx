import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import { addToCalendar, setForm, closeForm } from '../store/calendarSlice.js';
import { TextField } from '../components';
import '../components/SearchForms.css';

const CalendarSearchForm = ({ fOpen }) => {
  const initSearch = { name: '', author: '' };
  const [search, setSearch] = useState(initSearch);

  const [_, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });

  return (
    <>
      {/* <TextField TODO
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

      </div> */}
    </>
  );
};

export default CalendarSearchForm;
