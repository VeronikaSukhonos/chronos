import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Events from '../api/eventsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { setForm, closeForm, selectConfirmDeleteForm } from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { Checkbox, ConfirmDeleteForm, MenuButton, UserList } from '../components';
import { useClickOutside } from '../hooks';
import { UpdateIcon, DeleteIcon } from '../assets';
import { getEventIcon, getPublicEventIcon } from '../utils/getIcon.jsx';
import { fEventDate, fDate } from '../utils/formatDate.js';
import './ContentPage.css';
import './EventPage.css';
import '../components/DropdownMenu.css';

const EventMenu = ({ event, user, menuOpen, setMenuOpen, setLoad }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const confirmDeleteForm = useSelector(selectConfirmDeleteForm);

  const [hasRights, setHasRights] = useState(false);

  const updateEvent = () => { navigate(`/events/${event.id}/update`); };

  const deleteEvent = () => {
    setMenuOpen(false);
    dispatch(setForm({ form: 'confirmDeleteForm', params: { id: event.id,
      group: 'eventsParticipation', open: true }
    }));
  };

  useEffect(() => {
    if (['events', 'eventsParticipation'].includes(confirmDeleteForm.group)
      && confirmDeleteForm.id === event.id && confirmDeleteForm.result === true) {
      dispatch(closeForm('confirmDeleteForm'));
      setLoad(true);
      Events.deleteEvent(event.id)
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

  useEffect(() => {
    if (event.author.id === user.id)
      setHasRights(true);
    else {
      for (let i of event.participants) {
        if (i.id === user.id) {
          setHasRights(true);
          break;
        }
      }
    }
  }, [event, user]);

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      {event.author.id == user.id && <li onClick={updateEvent}>
        <button><UpdateIcon /><div>Update</div></button>
      </li>}
      {hasRights && <li onClick={deleteEvent}>
        <button><DeleteIcon /><div>Delete</div></button>
      </li>}
    </ul>
  );
}

const EventPage = () => {
  const { eventId } = useParams();
  const auth = useSelector(selectAuthUser.user);
  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });
  const [currEvent, setCurrEvent] = useState(null);
  const [load, setLoad] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const doTask = (e) => {
    if (e.target.value) {
      setLoad(true);
      Events.doTask(currEvent.id)
        .then(({ data: res }) => {
          setCurrEvent({...currEvent, doneDate: res.data.doneDate});
          setLoad(false);
          toast(res.message);
        }).catch((err) => {
          setLoad(false);
          toast(err.message);
        });
    } else {
      setLoad(true);
      Events.undoTask(currEvent.id)
        .then(({ data: res }) => {
          setCurrEvent({...currEvent, doneDate: res.data.doneDate});
          setLoad(false);
          toast(res.message);
        }).catch((err) => {
          setLoad(false);
          toast(err.message);
        });
    }
  };

  useEffect(() => {
      if (eventId) {
        setInitLoad(true);
        Events.fetchEvent(eventId)
          .then(({ data: res }) => {
            setCurrEvent(res.data.event);
            setInitLoad(false);
            setInitFeedback({ msg: res.message, status: 'ok' });
          })
          .catch((err) => {
            setInitLoad(false);
            setInitFeedback({ msg: err.message, status: 'fail' });
          });
      }

    }, [eventId]);

  useClickOutside([menuRef], () => setMenuOpen(false));

  if (!auth) return <Navigate to="/login" />
  if (!eventId) return <Navigate to="/" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} entity="event" />

  return (
    <div className="content-container">
      <div className="content-info-container">
        <div className="content-name-container">
          <h1 className="content-name event-title" style={{ background: currEvent.color || '#ade4ff' }}>
            {getEventIcon(currEvent.type, "content-meta-icon event-icon")}{currEvent.name}
          </h1>
          <div className="content-meta">
            {getPublicEventIcon(currEvent.visibleForAll, "content-meta-icon")}
            <div className="dropdown-menu-container" ref={menuRef}>
              <MenuButton constant={true} dis={load}
                onClick={() => { if (!menuOpen && !load) setMenuOpen(true); else setMenuOpen(false); }}
              />
              <EventMenu event={currEvent} user={auth}
                menuOpen={menuOpen} setMenuOpen={setMenuOpen} setLoad={setLoad}
              />
            </div>
          </div>
        </div>
        <div className="content-author-calendar-container">
          <Link className="content-author" to={`/users/${currEvent.author?.id}`}>
            <img
              className="content-author-avatar"
              src={`${import.meta.env.VITE_API_URL}${currEvent.author?.avatar}`}
              alt={`${currEvent.author?.login}'s avatar`}
            />
            <div className="content-author-login">{currEvent.author?.login}</div>
          </Link>
          <span>in</span>
          <Link to={`/calendars/${currEvent.calendar?.id}`}>
            <div className="searched-event-calendar">
              <div className="searched-event-calendar-color" style={{ background: currEvent.calendar?.color || '#ade4ff' }}></div>
              <div className="event-calendar-name">{currEvent.calendar?.name}</div>
            </div>
          </Link>
          <em className="event-create-date">
            (created {fDate(currEvent.createDate)})
          </em>
        </div>
        <em>{currEvent.repeat && `each ${currEvent.repeat.parameter} ${currEvent.repeat.frequency}${currEvent.repeat.parameter > 1 ? 's' : ''} since ` }
          {fEventDate(currEvent.type, currEvent.startDate, currEvent.endDate, currEvent.allDay)}
        </em>
        <div className="content-description">{currEvent.description}</div>
        {currEvent.type === "task" && <Checkbox
          label={"Done" + (currEvent.doneDate !== null ? ` (${fDate(currEvent.doneDate)})`:"")}
          id="markDone" name="markDone"
          checked={currEvent.doneDate !== null}
          onChange={doTask}
          short={false}
        />}
        <ul className="tags">
          {currEvent.tags.length > 0 && currEvent.tags.map((tag) => <li key={tag.id} className="content-name tag">{tag.title}</li>)}
        </ul>
      </div>

      {currEvent.calendar.type !== 'main' &&
        <div className="content-info-container">
          <h2>Participants</h2>
          <UserList
            users={currEvent.participants} name="participants"
            setUsers={(users) => setCurrEvent({...currEvent, participants: users})}
            author={auth.id === currEvent.calendar.author.id ? currEvent.calendar.author : currEvent.author}
            resend={Events.resendParticipation} del={Events.updateEvent} entityName="events" entityId={currEvent.id}
            notDeletable={[{ id: currEvent.author.id, role: 'event author' }, { id: currEvent.calendar.author.id, role: 'calendar author' }]}
          />
        </div>
      }

      {currEvent.type === "arrangement" && currEvent.link && <div className="content-info-container">
        <h2>Link to the arrangement</h2>
        <Link className="arrangement-link" to={currEvent.link} target="_blank">{currEvent.link}</Link>
      </div>}
      <ConfirmDeleteForm />
    </div>
  );
};

export default EventPage;
