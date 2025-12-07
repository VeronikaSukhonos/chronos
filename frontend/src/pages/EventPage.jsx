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

  const updateEvent = () => { navigate(`/events/${event.id}/update`); };

  const deleteEvent = () => {
    setMenuOpen(false);
    dispatch(setForm({ form: 'confirmDeleteForm', params: { id: event.id,
      group: 'events', open: true }
    }));
  };

  useEffect(() => {
    if (confirmDeleteForm.group === 'events'
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

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      {event.author.id == user.id && <>
        <li onClick={updateEvent}>
          <button><UpdateIcon /><div>Update</div></button>
        </li>
        <li onClick={deleteEvent}>
          <button><DeleteIcon /><div>Delete</div></button>
        </li>
      </>}
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
            <h1 className="content-name event-title" style={{ background: currEvent.color }}>{getEventIcon(currEvent.type, "content-meta-icon")}{currEvent.name}</h1>
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
        <Link to={`/calendars/${currEvent.calendar?.id}`}>
          <div className="searched-event-calendar">
            <div className="searched-event-calendar-color" style={{ background: currEvent.calendar?.color || '#ade4ff' }}></div>
            {currEvent.calendar?.name}
          </div>
        </Link>
        <em>{currEvent.repeat && `each ${currEvent.repeat.parameter} ${currEvent.repeat.frequency}${currEvent.repeat.parameter > 1 ? 's' : ''} from ` }{fEventDate(currEvent.type, currEvent.startDate, currEvent.endDate, currEvent.allDay)}; created at {fDate(currEvent.createDate)}</em>
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
      <div className="content-info-container">
        <h2>Participants</h2>
        <UserList
          users={currEvent.participants}
          setUsers={(users) => setCurrEvent({...currEvent, participants: users})}
          author={currEvent.author}
          resend={Events.resendParticipation} del={Events.updateEvent} entityName={'event'}
          entityId={currEvent.id} notDeletable={[currEvent.author.id, currEvent.calendar.authorId]}
        />
      </div>
      {currEvent.type === "arrangement" && currEvent.link && <div className="content-info-container">
        <h2>Link to the arrangement</h2>
        <Link to={currEvent.link}>{currEvent.link}</Link>
      </div>}
      <ConfirmDeleteForm />
    </div>
  );
};

export default EventPage;
