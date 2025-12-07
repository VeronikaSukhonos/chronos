import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import Events from '../api/eventsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { selectCalendar, setCalendar } from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import {
  TextField, SelectField, TextAreaField, DateField, ColorField, RepeatField,
  UserSearchForm, TagSelect, Checkbox, MainButton
} from '../components';
import { useForm } from '../hooks';
import { getEventIcon } from '../utils/getIcon.jsx';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const EventCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { eventId } = useParams();
  const auth = useSelector(selectAuthUser.user);
  const birthday = useSelector(selectCalendar.birthday);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });
  const [event, setEvent] = useState(null);
  const [calendar, setCurEventCalendar] = useState(null);
  const [calendars, setCurEventCalendars] = useState([]);
  const [notDeletable, setNotDeletable] = useState(eventId ? [] : [
    { id: auth?.id, login: auth?.login, avatar: auth?.avatar,
      isConfirmed: true, role: 'event author' }
  ]);

  const initialVals = {
    name: '', type: 'arrangement', startDate: '', endDate: '', allDay: false,
    description: '', calendar: null, color: '#ade4ff',
    participants: [{ id: auth?.id, login: auth?.login, avatar: auth?.avatar, isConfirmed: true }], visibleForAll: false,
    repeat: { frequency: 'never', parameter: 1 }, tags: [],
    link: ''
  };

  const {
    params, setParam, load, feedback, errors, resetForm, _, setFailure
  } = useForm(initialVals, () => {
    return {
      name: valid.calendarName(params),
      description: valid.calendarDescription(params),
      startDate: valid.startDate(params),
      endDate: valid.endDate(params),
      link: valid.arrangementLink(params)
    };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    if (eventId) {
      Events.updateEvent(eventId, {...params,
        participants: params.participants.map(p => p.id),
        repeat: params.repeat.frequency === 'never' ? null : params.repeat,
        tags: params.tags.map(t => t.id)
      })
        .then(({ data: res }) => {
          navigate(`/events/${eventId}`);
          toast(res.message);
        })
        .catch((err) => {
          setFailure(err);
        });
    } else {
      Calendars.createEvent(params.calendar, {...params,
        participants: params.participants.map(p => p.id),
        repeat: params.repeat.frequency === 'never' ? null : params.repeat,
        tags: params.tags.map(t => t.id)
      })
        .then(({ data: res }) => {
          navigate(`/events/${res.data.event.id}`);
          toast(res.message);
        })
        .catch((err) => {
          setFailure(err);
        });
    }
  };

  useEffect(() => {
    if (eventId) {
      Events.fetchEvent(eventId)
        .then(({ data: res }) => {
          for (const [prop, val] of Object.entries(initialVals))
            setParam({ target: {
              name: prop,
              value: (prop === 'calendar' ? res.data.event.calendar.id : res.data.event[prop]) || val } });
          setEvent(res.data.event);
          setCurEventCalendar(res.data.event.calendar);
          if (!res.data.event.visibleForAll) {
              const participants = [{
                id: res.data.event.author.id,
                role: 'event author'
              }];

              if (res.data.event.calendar.authorId !== participants[0].id) {
                participants.push({
                  id: res.data.event.calendar.authorId,
                  role: 'calendar author'
                });
              }
              setNotDeletable(participants);
          } else {
            setNotDeletable([]);
          }
          setInitLoad(false);
          setInitFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          setInitLoad(false);
          setInitFeedback({ msg: err.message, status: 'fail' });
        });
    } else {
      Calendars.fetchCalendars()
        .then(({ data: res }) => {
          const main = res.data.calendars.find(c => c.type === 'main');

          setCurEventCalendars(res.data.calendars.filter(
            (c => ['author', 'participant'].includes(c.role) && c.type !== 'holidays')));
          for (const [prop, val] of Object.entries(initialVals))
            setParam({ target: {
              name: prop,
              value:
                prop === 'calendar' ? main?.id :
                (prop === 'color' ? (main?.color || '#ade4ff') :
                ((prop === 'startDate' && false) ? new Date() : val))
            }});
          if (birthday) {
            setParam({ target: { name: 'name', value: `${birthday.fullName || birthday.login}'s Birthday` }});
            setParam({ target: { name: 'startDate', value: new Date(birthday.dob) }});
            setParam({ target: { name: 'type', value: 'birthday' }});
            setParam({ target: { name: 'allDay', value: true }});
          }
          setInitLoad(false);
        })
        .catch((err) => {
          setInitLoad(false);
          setInitFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, [eventId]);

  useEffect(() => {
    return () => dispatch(setCalendar());
  }, []);

  if (!auth) return <Navigate to="/login" />
  if (!eventId && !location.pathname.includes('create')) return <Navigate to="/" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} entity="event" />

  return (
    <div className="center-container">
      <h1 className="basic-form-title">{eventId ? "Update" : "Create"} Event</h1>

      <form className="basic-form" onSubmit={submit}>
        {eventId && <div className="basic-form-note"><Link to={`/events/${eventId}`}>Back to event</Link></div>}

        <TextField
          label="Name"
          onChange={setParam}
          id="evt-name" name="name"
          val={params.name}
          err={errors}
          req={true}
        />
        <SelectField
          label="Type"
          name="type"
          options={[
            { label: <div>{getEventIcon('arrangement')}Arrangement</div>, value: 'arrangement' },
            { label: <div>{getEventIcon('reminder')}Reminder</div>, value: 'reminder' },
            { label: <div>{getEventIcon('task')}Task</div>, value: 'task' },
            { label: <div>{getEventIcon('holiday')}Holiday</div>, value: 'holiday' },
            { label: <div>{getEventIcon('birthday')}Birthday</div>, value: 'birthday' }
          ]}
          selected={params.type}
          onChange={(v) => {
            setParam(v);
            setParam({ target: { name: 'allDay', value: ['holiday', 'birthday'].includes(v.target.value) } });
            setParam({ target: { name: 'link', value: '' } });
            if (['task', 'holiday', 'birthday'].includes(v.target.value))
              setParam({ target: { name: 'repeat', value: initialVals.repeat } });
          }}
          dis={eventId}
          err={errors}
        />
        <SelectField
          label="Calendar"
          name="calendar"
          options={
            !eventId ? calendars?.map(c => ({
              label: <div><span style={{background: c.color}}></span>{c.name}</div>, value: c.id
            })) : [{
              label: <div><span style={{background: calendar?.color}}></span>{calendar?.name}</div>, value: calendar?.id
            }]
          }
          selected={params.calendar}
          onChange={(v) => {
            const prevCldAuthorId = calendars?.find(c => c.id === params.calendar)?.author?.id;
            const newCld = calendars?.find(c => c.id === v.target.value);
            const cldAuthor = {
              id: newCld?.author.id,
              login: newCld?.author.login,
              avatar: newCld?.author.avatar,
              isConfirmed: true,
              role: 'calendar author'
            };

            setParam(v);
            setParam({ target: { name: 'color', value: newCld?.color }});
            if (!params.visibleForAll) {
              let tmp = params.participants.filter(u => (u.id !== prevCldAuthorId || u.id === auth.id));

              setParam({ target: {
                name: 'participants',
                value: cldAuthor.id === auth.id ? tmp : [...tmp.slice(0, 1), cldAuthor, ...tmp.slice(1)]
              }});
              tmp = notDeletable.filter(u => (u.id !== prevCldAuthorId || u.id === auth.id));
              setNotDeletable(cldAuthor.id === auth.id ? tmp : [...tmp.slice(0, 1), cldAuthor, ...tmp.slice(1)]);
            }
          }}
          dis={eventId}
          err={errors}
        />
        <DateField
          label={(['arrangement', 'task'].includes(params.type) && !params.allDay) ? "Start" : "Date"}
          id="startDate"
          time={!params.allDay}
          onChange={setParam}
          val={(eventId && params.startDate) ? new Date(params.startDate) : params.startDate}
          min={params.type === 'birthday' ? undefined : new Date()}
          max={params.type === 'birthday' ? new Date() : undefined}
          err={errors}
          req={true}
        />
        {!params.allDay && ['arrangement', 'task'].includes(params.type) && <DateField
          label={params.type === 'arrangement' ? 'End' : 'Deadline'}
          id="endDate"
          time={true}
          onChange={setParam}
          val={(eventId && params.endDate) ? new Date(params.endDate) : params.endDate}
          min={(eventId && params.startDate) ? new Date(params.startDate) : params.startDate}
          err={errors}
        />}
        {!['holiday', 'birthday'].includes(params.type) && <Checkbox
          label="All day?"
          id="allDay" name="allDay"
          checked={params.allDay}
          onChange={(v) => {
            setParam(v);
            setParam({ target: { name: 'endDate', value: '' } });
          }}
          short={false}
        />}
        <ColorField
          label="Event Color" name="color" id="evt"
          checked={params.color}
          onChange={setParam}
          err={errors}
        />
        <TextAreaField
          label="Description"
          onChange={setParam}
          id="evt-description" name="description"
          val={params.description}
          err={errors}
        />
        {(eventId ? calendar?.type !== 'main' : (calendars.find(c => c.id === params.calendar)?.type !== 'main'))
          && <UserSearchForm
          label="Participants" name="participants" err={errors} id="evt-participants"
          chosen={params.participants} setChosen={setParam}
          author={event?.author || auth}
          resend={params.visibleForAll ? undefined: Events.resendParticipation}
          entityId={eventId} entityName='events'
          del={Events.updateEvent}
          fOpen={null}
          notDeletable={notDeletable}
        />}
        {(eventId ? calendar?.type !== 'main' : (calendars.find(c => c.id === params.calendar)?.type !== 'main'))
          && <Checkbox
          label="Visible for everyone in the calendar?"
          id="visibleForAll" name="visibleForAll"
          checked={params.visibleForAll}
          onChange={(v) => {
            if (v.target.value) {
              setParam({ target: { name: 'participants', value: [] } });
              setNotDeletable([]);
            } else {
              if (!params.participants.length) {
                const participants = [{
                  id: event?.author?.id || auth.id,
                  login: event?.author?.login || auth.login,
                  avatar: event?.author?.avatar || auth.avatar,
                  isConfirmed: true,
                  role: 'event author'
                }];
                const cld = eventId ? calendar.authorId : calendars?.find(c => c.id === params.calendar);

                if (cld.author.id !== participants[0].id) {
                  participants.push({
                    id: cld?.author?.id,
                    login: cld?.author?.login,
                    avatar: cld?.author?.avatar,
                    isConfirmed: true,
                    role: 'calendar author'
                  });
                }
                setParam({ target: { name: 'participants', value: participants } });
                setNotDeletable(participants);
              }
            }
            setParam(v);
          }}
          short={false}
        />}
        {!['task', 'holiday', 'birthday'].includes(params.type) &&
          <RepeatField
            label="Repeat"
            selectedFrequency={params.repeat.frequency}
            selectedParameter={params.repeat.parameter}
            onChangeFrequency={setParam}
            onChangeParameter={setParam}
            fOpen={null}
            err={errors}
          />
        }
        <TagSelect
          label="Tags"
          name="tags"
          chosen={params.tags}
          setChosen={setParam}
          fOpen={true}
          err={errors}
        />
        {params.type === 'arrangement' && <TextField
          label="Link"
          onChange={setParam}
          id="link"
          val={params.link}
          err={errors}
        />}

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title={eventId ? "Update" : "Create"} dis={load} />
      </form>
    </div>
  );
};

export default EventCreatePage;
