import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';

import Calendars from '../api/calendarsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { setCalendar, setForm, closeForm, selectConfirmDeleteForm } from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { Calendar, ConfirmDeleteForm, MenuButton, UserList } from '../components';
import { useClickOutside } from '../hooks';
import { EyeOpenIcon, ColorIcon, UpdateIcon, ArchiveIcon, DeleteIcon } from '../assets';
import { getCalendarIcon } from '../utils/getIcon.jsx';
import './ContentPage.css';
import '../components/DropdownMenu.css';

const CalendarMenu = ({ calendar, setCalendar, menuOpen, setMenuOpen, setLoad }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const confirmDeleteForm = useSelector(selectConfirmDeleteForm);

  const followCalendar = () => {
    setMenuOpen(false);
    setLoad(true);
    Calendars.followCalendar(calendar.id)
      .then(({ data: res }) => {
        setCalendar({...calendar, role: 'follower'});
        setLoad(false);
        toast(res.message);
      })
      .catch((err) => {
        setLoad(false);
        toast(err.message);
      });
  };

  const updateColor = () => { navigate(`/calendars${calendar.id}/update`); };
  const updateCalendar = () => { navigate(`/calendars${calendar.id}/update`); };

  const archiveCalendar = () => {
    const endpoint = !calendar.isHidden ? Calendars.archiveCalendar : Calendars.dearchiveCalendar;

    setMenuOpen(false);
    setLoad(true);
    endpoint(calendar.id)
      .then(({ data: res }) => {
        setCalendar({...calendar, isHidden: !calendar.isHidden});
        setLoad(false);
        toast(res.message);
      })
      .catch((err) => {
        setLoad(false);
        toast(err.message);
      });
  };

  const deleteCalendar = () => {
    setMenuOpen(false);
    dispatch(setForm({ form: 'confirmDeleteForm', params: { id: calendar.id,
      group: (calendar.role === 'author' ? 'myCalendars' : 'otherCalendars'), open: true }
    }));
  };

  useEffect(() => {
    if (['myCalendars', 'otherCalendars'].includes(confirmDeleteForm.group)
      && confirmDeleteForm.id === calendar.id && confirmDeleteForm.result === true) {
      dispatch(closeForm('confirmDeleteForm'));
      setLoad(true);
      Calendars.deleteCalendar(calendar.id)
        .then(({ data: res }) => {
          navigate('/');
          setLoad(false);
          toast(res.message);
        })
        .catch((err) => {
          setLoad(false);
          toast(err.message);
        });
      }
  }, [confirmDeleteForm.id, confirmDeleteForm.group, confirmDeleteForm.result]);

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      {calendar.role === 'guest' && <li onClick={followCalendar}>
        <button><EyeOpenIcon /><div>Follow</div></button>
      </li>}
      {calendar.role == 'author' && ['main', 'holidays'].includes(calendar.type)
        && <li onClick={updateColor}>
        <button><ColorIcon /><div>Set color</div></button>
      </li>}
      {calendar.role == 'author' && !['main', 'holidays'].includes(calendar.type)
        && <>
          <li onClick={updateCalendar}>
            <button><UpdateIcon /><div>Update</div></button>
          </li>
          <li onClick={archiveCalendar}>
            <button><ArchiveIcon /><div>{!calendar.isHidden ? 'Archive' : 'Dearchive'}</div></button>
          </li>
        </>}
      {calendar.role !== 'guest' && !['main', 'holidays'].includes(calendar.type)
        && <li onClick={deleteCalendar}>
        <button><DeleteIcon /><div>Delete</div></button>
      </li>}
    </ul>
  );
};

const CalendarPage = () => {
  const { calendarId } = useParams();

  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });

  const [curCalendar, setCurCalendar] = useState(null);
  const [load, setLoad] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (calendarId) {
      Calendars.fetchCalendar(calendarId)
        .then(({ data: res }) => {
          setCurCalendar(res.data.calendar);
          setInitLoad(false);
          setInitFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          setInitLoad(false);
          setInitFeedback({ msg: err.message, status: 'fail' });
        });
    }

    return () => dispatch(setCalendar());
  }, [calendarId]);

  useClickOutside([menuRef], () => setMenuOpen(false));

  if (!auth) return <Navigate to="/login" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} entity="calendar" />

  return (
    <div className="content-container">
      <div className="content-info-container">
        <div className="content-name-container">
          <h1 className="content-name" style={{ background: curCalendar.color }}>{curCalendar.name}</h1>
          <div className="content-meta">
            {getCalendarIcon(curCalendar, "content-meta-icon")}
            <div className="dropdown-menu-container" ref={menuRef}>
              <MenuButton constant={true} dis={load}
                onClick={() => { if (!menuOpen && !load) setMenuOpen(true); else setMenuOpen(false); }}
              />
              <CalendarMenu calendar={curCalendar} setCalendar={setCurCalendar}
                menuOpen={menuOpen} setMenuOpen={setMenuOpen} setLoad={setLoad}
              />
            </div>
          </div>
        </div>

        <Link className="content-author" to={`/users/${curCalendar.author?.id}`}>
          <img
            className="content-author-avatar"
            src={`${import.meta.env.VITE_API_URL}${curCalendar.author?.avatar}`}
            alt={`${curCalendar.author?.login}'s avatar`}
          />
          <div className="content-author-login">{curCalendar.author?.login}</div>
        </Link>
        <div className="content-description">{curCalendar.description}</div>
      </div>

      {!['main', 'holidays'].includes(curCalendar.type) && <div className="content-info-container">
        <h2>Participants</h2>
        <UserList
          users={curCalendar.participants}
          setUsers={(users) => setCurCalendar({...curCalendar, participants: users})}
          author={curCalendar.author}
          resend={Calendars.resendParticipation} del={Calendars.updateCalendar}
          entityId={curCalendar.id}
        />
      </div>}
      {curCalendar.isPublic && <div className="content-info-container">
        <h2>Followers</h2>
        <UserList
          users={curCalendar.followers}
          setUsers={(users) => setCurCalendar({...curCalendar, followers: users})}
          author={curCalendar.author}
          del={Calendars.updateCalendar}
        />
      </div>}
      <div className="content-info-container">
        <h2>Events</h2>
        {!curCalendar.events?.length > 0 && <div className="info-message left">No events in this calendar</div>}
      </div>
      <ConfirmDeleteForm />
    </div>
  );
};

export default CalendarPage;
