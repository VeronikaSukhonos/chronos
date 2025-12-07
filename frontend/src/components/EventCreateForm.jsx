import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMinutes } from 'date-fns';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import Events from '../api/eventsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import {
  selectCalendar, addToCalendar, updateInCalendar, selectEventCreateForm, setForm, closeForm
} from '../store/calendarSlice.js';
import {
  Modal, TextField, SelectField, TextAreaField, DateField, ColorField, RepeatField,
  UserSearchForm, TagSelect, Checkbox, MainButton
} from '../components';
import { useForm } from '../hooks';
import { getEventIcon } from '../utils/getIcon.jsx';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const EventCreateForm = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const f = useSelector(selectEventCreateForm);
  const view = useSelector(selectCalendar.view);
  const formOpenRef = useRef();

  const initialVals = {
    name: '', type: 'arrangement', startDate: '', endDate: '', allDay: false,
    description: '', calendar: null, color: '#ade4ff',
    participants: [{ id: auth.id, login: auth.login, avatar: auth.avatar, isConfirmed: true }], visibleForAll: false,
    repeat: { frequency: 'never', parameter: 1 }, tags: [],
    link: ''
  };

  const {
    params, setParam, load, feedback, errors, resetForm, _, setFailure, clearForm
  } = useForm(initialVals, () => {
    return {
      name: valid.calendarName(params),
      description: valid.calendarDescription(params),
      startDate: valid.startDate(params),
      endDate: valid.endDate(params),
      link: valid.arrangementLink(params)
    };
  });

  const [initLoad, setInitLoad] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [notDeletable, setNotDeletable] = useState([
    { id: auth.id, login: auth.login, avatar: auth.avatar,
      isConfirmed: true, role: 'event author' }
  ]);

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    if (f.event?.id) {
      Events.updateEvent(f.event?.id, {...params,
        participants: params.participants.map(p => p.id),
        repeat: params.repeat.frequency === 'never' ? null : params.repeat,
        tags: params.tags.map(t => t.id)
      })
        .then(({ data: res }) => {
          if (res.data?.event) dispatch(updateInCalendar({
            group: 'events', item: res.data.event
          }));
          dispatch(setForm({ form: 'eventCreateForm',
            params: { event: { id: f.event?.id, ...params }}}));
          dispatch(closeForm('eventCreateForm'));
          toast(res.message);
        })
        .catch((err) => { if (formOpenRef.current) setFailure(err); });
    } else {
      Calendars.createEvent(params.calendar, {...params,
        participants: params.participants.map(p => p.id),
        repeat: params.repeat.frequency === 'never' ? null : params.repeat,
        tags: params.tags.map(t => t.id)
      })
        .then(({ data: res }) => {
          dispatch(addToCalendar({ group: 'events', item: res.data.event }));
          dispatch(closeForm('eventCreateForm'));
          toast(res.message);
        })
        .catch((err) => { if (formOpenRef.current) setFailure(err); });
    }
  };

  useEffect(() => {
    formOpenRef.current = f.open;
    if (!f.open) clearForm();
  }, [f.open]);

  useEffect(() => {
    if (f.open) {
      setInitLoad(true);
      if (f.event?.id) {
        Events.fetchEvent(f.event?.id)
          .then(({ data: res }) => {
            for (const [prop, val] of Object.entries(initialVals))
              setParam({ target: {
                name: prop,
                value: (prop === 'calendar' ? res.data.event.calendar.id : res.data.event[prop]) || val } });
              dispatch(setForm({ form: 'eventCreateForm',
                params: { event: res.data.event, calendar: res.data.event.calendar }}));
            if (!res.data.event.visibleForAll) {
                const participants = [{
                    id: res.data.event.author.id,
                    role: 'event author'
                  }
                ];

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
          })
          .catch((err) => {
            for (const [prop, val] of Object.entries(initialVals))
              setParam({ target: { name: prop, value: val } });
            setInitLoad(false);
            dispatch(closeForm('eventCreateForm'));
            toast(err.message);
          });
      } else {
        Calendars.fetchCalendars()
          .then(({ data: res }) => {
            const main = res.data.calendars.find(c => c.type === 'main');
            const now = addMinutes(new Date(), 10);
            const initDate = new Date(f.initDate);
            let startDate = initialVals.startDate;

            if (f.initDate && initDate >= new Date()) {
              if (['timeGridDay', 'timeGridWeek'].includes(view)) {
                startDate = initDate;
              } else {
                initDate.setHours(now.getHours(), now.getMinutes());
                startDate = initDate;
              }
            } else {
              startDate = now;
            }

            setCalendars(res.data.calendars.filter(
              (c => ['author', 'participant'].includes(c.role) && c.type !== 'holidays')));
            for (const [prop, val] of Object.entries(initialVals))
              setParam({ target: {
                name: prop,
                value:
                  prop === 'calendar' ? main?.id :
                  (prop === 'color' ? (main?.color || '#ade4ff') :
                  (prop === 'startDate' ? startDate : val))
              }});
            setInitLoad(false);
          })
          .catch((err) => {
            for (const [prop, val] of Object.entries(initialVals))
              setParam({ target: { name: prop, value: val } });
            setInitLoad(false);
            dispatch(closeForm('eventCreateForm'));
            toast(err.message);
          });
      }
    }
  }, [f.event, f.open]);

  return (
    <Modal
      modalOpen={f.open}
      setModalOpen={(_) => { if (!load && !initLoad) dispatch(closeForm('eventCreateForm')); }}
      title={f.event?.id ? "Update Event" : "Create Event"}
    >
      <form className="basic-form transparent" onSubmit={submit}>
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
          dis={f.event?.id}
          err={errors}
        />
        <SelectField
          label="Calendar"
          name="calendar"
          options={
            !f.event?.id ? calendars?.map(c => ({
              label: <div><span style={{background: c.color}}></span>{c.name}</div>, value: c.id
            })) : [{
              label: <div><span style={{background: f.calendar?.color}}></span>{f.calendar.name}</div>, value: f.calendar.id
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
          dis={f.event?.id}
          err={errors}
        />
        <DateField
          label={(['arrangement', 'task'].includes(params.type) && !params.allDay) ? "Start" : "Date"}
          id="startDate"
          time={!params.allDay}
          onChange={setParam}
          val={(f.event?.id && params.startDate) ? new Date(params.startDate) : params.startDate}
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
          val={(f.event?.id && params.endDate) ? new Date(params.endDate) : params.endDate}
          min={(f.event?.id && params.startDate) ? new Date(params.startDate) : params.startDate}
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
        {(f.event?.id ? f.calendar?.type !== 'main' : (calendars.find(c => c.id === params.calendar)?.type !== 'main'))
          && <UserSearchForm
          label="Participants" name="participants" err={errors} id="evt-participants"
          chosen={params.participants} setChosen={setParam}
          author={f.event?.author || auth}
          resend={params.visibleForAll ? undefined: Events.resendParticipation}
          entityId={f.event?.id} entityName='events'
          del={Events.updateEvent}
          fOpen={formOpenRef.current}
          notDeletable={notDeletable}
        />}
        {(f.event?.id ? f.calendar?.type !== 'main' : (calendars.find(c => c.id === params.calendar)?.type !== 'main'))
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
                  id: f.event?.author?.id || auth.id,
                  login: f.event?.author?.login || auth.login,
                  avatar: f.event?.author?.avatar || auth.avatar,
                  isConfirmed: true,
                  role: 'event author'
                }];
                const cld = f.event?.id ? f.calendar?.authorId : calendars?.find(c => c.id === params.calendar);

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
            fOpen={formOpenRef.current}
            err={errors}
          />
        }
        <TagSelect
          label="Tags"
          name="tags"
          chosen={params.tags}
          setChosen={setParam}
          fOpen={formOpenRef.current}
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

        <MainButton title={f.event?.id ? "Update" : "Create"} dis={load || initLoad} />
      </form>
    </Modal>
  );
};

export default EventCreateForm;
