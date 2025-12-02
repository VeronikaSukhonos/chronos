import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';

import Calendars from '../api/calendarsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import {
  selectCalendar, setCalendar, deleteFromCalendar
} from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { ConfirmDeleteForm, MenuButton } from '../components';
import { useClickOutside } from '../hooks';
import { getCalendarIcon } from '../utils/getIcon.jsx';
import './ContentPage.css';
import '../components/Forms.css';
import '../components/DropdownMenu.css';

const ArchivePage = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const archived = useSelector(selectCalendar.archived);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });

  const [load, setLoad] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    Calendars.fetchHiddenCalendars()
      .then(({ data: res }) => {
        dispatch(setCalendar({ archived: res.data.calendars }));
        setInitLoad(false);
        setInitFeedback({ msg: res.message, status: 'ok' });
      })
      .catch((err) => {
        setInitLoad(false);
        setInitFeedback({ msg: err.message, status: 'fail' });
      });

    return () => dispatch(setCalendar());
  }, []);

  useClickOutside([menuRef], () => setMenuOpen(false));

  if (!auth) return <Navigate to="/login" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} />

  return (
    <div className="horizontal center-container archive-page">
      <h1 className="basic-form-title">Archive</h1>

      <div className="archived-calendars-container">
        {archived.map(c => {
          return <Link className="archived-calendar">
            <div className="archived-calendar-name-container">
              <div className="" style={{ background: c.color }}>{c.name}</div>
              {JSON.stringify(c)}
            </div>
          </Link>
        })}
      </div>
      <ConfirmDeleteForm />
    </div>
  );
};

export default ArchivePage;
