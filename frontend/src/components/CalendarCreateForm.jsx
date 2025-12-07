import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import {
  addToCalendar, updateInCalendar, selectCalendarCreateForm, setForm, closeForm
} from '../store/calendarSlice.js';
import {
  Modal, TextField, TextAreaField, ColorField,
  CalendarSearchForm, UserSearchForm, Checkbox, MainButton
} from '../components';
import { useForm } from '../hooks';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const CalendarCreateForm = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const f = useSelector(selectCalendarCreateForm);
  const formOpenRef = useRef();

  const initialVals = {
    name: '', description: '', color: '#ade4ff',
    participants: [], followers: [], isPublic: false
  };

  const {
    params, setParam, load, feedback, errors, resetForm, _, setFailure, clearForm
  } = useForm(initialVals, () => {
    return { name: valid.calendarName(params), description: valid.calendarDescription(params) };
  });

  const [initLoad, setInitLoad] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    if (f.calendar?.id) {
      Calendars.updateCalendar(f.calendar?.id, {...params,
        participants: params.participants.map(p => p.id), followers: params.followers?.map(f => f.id)
      })
        .then(({ data: res }) => {
          if (res.data?.calendar) dispatch(updateInCalendar({
            group: 'myCalendars', item: res.data.calendar
          }));
          dispatch(setForm({ form: 'calendarCreateForm',
            params: { calendar: { id: f.calendar?.id, ...params }}}));
          dispatch(closeForm('calendarCreateForm'));
          toast(res.message);
        })
        .catch((err) => { if (formOpenRef.current) setFailure(err); });
    } else {
      Calendars.createCalendar({...params, participants: params.participants.map(p => p.id) })
        .then(({ data: res }) => {
          dispatch(addToCalendar({ group: 'myCalendars', item: res.data.calendar }));
          dispatch(closeForm('calendarCreateForm'));
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
    if (f.calendar?.id) {
      setInitLoad(true);
      Calendars.fetchCalendar(f.calendar?.id)
        .then(({ data: res }) => {
          for (const [prop, val] of Object.entries(initialVals))
            setParam({ target: { name: prop, value: res.data.calendar[prop] || val } });
          setInitLoad(false);
        })
        .catch((err) => {
          for (const [prop, val] of Object.entries(initialVals))
            setParam({ target: { name: prop, value: val } });
          setInitLoad(false);
          dispatch(closeForm('calendarCreateForm'));
          toast(err.message);
        });
    } else {
      for (const [prop, val] of Object.entries(initialVals))
        setParam({ target: { name: prop, value: val } });
    }
  }, [f.calendar]);

  return (
    <Modal
      modalOpen={f.open}
      setModalOpen={(_) => { if (!load && !initLoad) dispatch(closeForm('calendarCreateForm')); }}
      title={f.calendar?.id ? "Update Calendar"
        : (f.findMode ? "Find Calendar" : "Create Calendar")}
    >
      <form className="basic-form transparent" onSubmit={submit}>
        {!f.calendar?.id && <div className="basic-form-note">
            <div className="link" onClick={() => {
              if (!load && !initLoad)
                dispatch(setForm({form: 'calendarCreateForm', params: { findMode: !f.findMode }}))
            }}>
              {f.findMode ? 'Want to create your own calendar instead?'
                : 'Want to find a public calendar instead?'}
            </div>
          </div>}
        {!f.findMode &&
          <>
            <TextField
              label="Name"
              onChange={setParam}
              id="name"
              val={params.name}
              err={errors}
              req={true} dis={f.onlyColor}
              />
            <TextAreaField
              label="Description"
              onChange={setParam}
              id="description"
              val={params.description}
              err={errors} dis={f.onlyColor}
            />
            <ColorField
              label="Default Event Color" name="color" id="cld"
              checked={params.color}
              onChange={setParam}
              err={errors}
            />
          </>
        }
        {!f.onlyColor && !f.findMode &&
          <>
            <UserSearchForm
              label="Participants" name="participants" err={errors}
              chosen={params.participants} setChosen={setParam}
              author={f.calendar?.author || auth}
              resend={Calendars.resendParticipation}
              entityId={f.calendar?.id} entityName='calendar'
              del={Calendars.updateCalendar}
              fOpen={formOpenRef.current}
              removeFollower={f.calendar?.id && f.calendar?.isPublic
                ? (id) => setParam({ target: {
                  name: 'followers', value: params.followers.filter(f => f.id !== id)
                }}) : undefined}
            />
            {f.calendar?.id && f.calendar?.isPublic &&
              <UserSearchForm
                label="Participants" name="participants" err={errors}
                chosen={params.followers} setChosen={setParam}
                author={f.calendar?.author || auth}
                del={Calendars.updateCalendar}
                entityName='followers'
              />}
            <Checkbox
              label="Make this calendar public?"
              id="isPublic" name="isPublic"
              checked={params.isPublic}
              onChange={setParam}
              short={false}
            />
          </>
        }
        {f.findMode && <CalendarSearchForm fOpen={formOpenRef.current} findMode={f.findMode} />}

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        {!f.findMode && <MainButton title={f.calendar?.id ? "Update" : "Create"} dis={load || initLoad} />}
      </form>
    </Modal>
  );
};

export default CalendarCreateForm;
