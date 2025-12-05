import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import {
  selectCalendar, setCalendar,
  deleteFromCalendar,
  selectConfirmDeleteForm, setForm, closeForm
} from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { ConfirmDeleteForm, MenuButton } from '../components';
import { useClickOutside } from '../hooks';
import {
  ArchiveIcon, DeleteIcon
} from '../assets';
import { getCalendarIcon } from '../utils/getIcon.jsx';
import './ContentPage.css';
import './ArchivePage.css';
import '../components/Forms.css';
import '../components/DropdownMenu.css';

const CalendarMenu = ({ calendar, menuOpen, setMenuOpen, setLoad }) => {
  const dispatch = useDispatch();

  const confirmDeleteForm = useSelector(selectConfirmDeleteForm);

  const dearchiveCalendar = () => {
    setMenuOpen(false);
    setLoad(true);

    Calendars.dearchiveCalendar(calendar.id)
      .then(({ data: res }) => {
        dispatch(deleteFromCalendar({ group: 'archived', id: calendar.id }));
        setLoad(false);
        toast(res.message);
      })
      .catch((err) => {
        setLoad(false);
        toast(err.message);
      });
  };

  useEffect(() => {
    if (['myCalendars', 'otherCalendars'].includes(confirmDeleteForm.group)
      && confirmDeleteForm.id === calendar.id && confirmDeleteForm.result === true) {
      dispatch(closeForm('confirmDeleteForm'));
      setLoad(true);

      Calendars.deleteCalendar(calendar.id)
        .then(({ data: res }) => {
          dispatch(deleteFromCalendar({ group: 'archived', id: calendar.id }));
          setLoad(false);
          toast(res.message);
        })
        .catch((err) => {
          setLoad(false);
          toast(err.message);
        });
      }
  }, [confirmDeleteForm.id, confirmDeleteForm.group, confirmDeleteForm.result]);

  const dearchive =
    <li onClick={dearchiveCalendar}>
      <button><ArchiveIcon /><div>Dearchive</div></button>
    </li>

  const del =
    <li onClick={() => {setMenuOpen(false); dispatch(setForm({
        form: 'confirmDeleteForm', params: {
          id: calendar.id, group: 'myCalendars', open: true }}
      ))}}>
      <button><DeleteIcon /><div>Delete</div></button>
    </li>

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      <>{dearchive}{del}</>
    </ul>
  );
};

const ArchivedCalendar = ({ calendar }) => {
  const [load, setLoad] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const formatNumber = (n) => {
    if (n >= 1000000000)
      return '999.9+M';
    else {
      const idx = n >= 1000000 ? 'M' : n >= 1000 ? 'K' : '';
      const divisor = n >= 1000000 ? 1000000 : n >= 1000 ? 1000 : 1;
      if (n < 1000)
        return n;
      else
        return `${Math.floor(n / divisor)}.${Math.floor((n % divisor) / (divisor / 10))}${idx}`;
    }
  };

  useClickOutside([menuRef], () => setMenuOpen(false));

  return (
    <div className="archive-item">
      <div className="content-name-container">
        <Link to={`/calendars/${calendar.id}`}>
          <h1 className="content-name" style={{ background: calendar.color }}>{calendar.name}</h1>
        </Link>
        <div className="content-meta">
          {getCalendarIcon(calendar, "content-meta-icon")}
          <div className="dropdown-menu-container" ref={menuRef}>
            <MenuButton constant={true} dis={load}
              onClick={() => { if (!menuOpen && !load) setMenuOpen(true); else setMenuOpen(false); }}
            />
            <CalendarMenu calendar={calendar} menuOpen={menuOpen} setMenuOpen={setMenuOpen} setLoad={setLoad} />
          </div>
        </div>
      </div>
      <div className="content-description">
        <p>{formatNumber(calendar.eventsCount || 0)}<br />events</p>
        <p>{formatNumber(calendar.participantsCount || 0)}<br />participants</p>
        <p>{formatNumber(calendar.followersCount || 0)}<br />followers</p>
      </div>
    </div>
  );
};

const ArchivePage = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const archived = useSelector(selectCalendar.archived);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });

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

  if (!auth) return <Navigate to="/login" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} />

  return (
    <div className="horizontal center-container">
      <h1 className="basic-form-title">Archive</h1>

      {archived.length < 1
        ? <div className="info-message">You have no archived calendars</div>
        : <div className="archived-calendars-container">
            {archived.map(c => <ArchivedCalendar key={c.id} calendar={c} />)}
          </div>}
      <ConfirmDeleteForm />
    </div>
  );
};

export default ArchivePage;
