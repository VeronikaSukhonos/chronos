import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import {
  TextField, TextAreaField, ColorField, UserSearchForm, Checkbox, MainButton
} from '../components';
import { useForm } from '../hooks';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const CalendarUpdatePage = () => {
  const navigate = useNavigate();

  const { calendarId } = useParams();
  const auth = useSelector(selectAuthUser.user);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });
  const [calendar, setCalendar] = useState(null);

  const initParams = {
    name: '', description: '', color: '#ade4ff',
    participants: [], followers: [], isPublic: false
  };

  const {
    params, setParam, load, feedback, errors, resetForm, _, setFailure
  } = useForm(initParams, () => {
    return { name: valid.calendarName(params), description: valid.calendarDescription(params) };
  }, false);

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Calendars.updateCalendar(calendarId, {...params,
      participants: params.participants.map(p => p.id),
      followers: params.followers?.map(f => f.id)
    })
      .then(({ data: res }) => {
        navigate(`/calendars/${calendarId}`);
        toast(res.message);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  useEffect(() => {
    if (calendarId) {
      Calendars.fetchCalendar(calendarId)
        .then(({ data: res }) => {
          for (const [prop, val] of Object.entries(initParams))
            setParam({ target: { name: prop, value: res.data.calendar[prop] || val } });
          setCalendar(res.data.calendar);
          setInitLoad(false);
          setInitFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          setInitLoad(false);
          setInitFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, [calendarId]);

  if (!auth) return <Navigate to="/login" />
  if (!calendarId) return <Navigate to="/" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} entity="calendar" />

  return (
    <div className="center-container">
      <h1 className="basic-form-title">Update Calendar</h1>

      <form className="basic-form" onSubmit={submit}>
        <div className="basic-form-note"><Link to={`/calendars/${calendarId}`}>Back to calendar</Link></div>

        <TextField
          label="Name"
          onChange={setParam}
          id="name"
          val={params.name}
          err={errors}
          req={true} dis={['main', 'holidays'].includes(calendar.type)}
          />
        <TextAreaField
          label="Description"
          onChange={setParam}
          id="description"
          val={params.description}
          err={errors} dis={['main', 'holidays'].includes(calendar.type)}
        />
        <ColorField
          label="Default Event Color" name="color"
          checked={params.color}
          onChange={setParam}
          err={errors}
        />
        {
          !['main', 'holidays'].includes(calendar.type) &&
          <>
            <UserSearchForm
              label="Participants" name="participants" err={errors}
              chosen={params.participants}
              setChosen={setParam}
              author={calendar.author}
              resend={Calendars.resendParticipation}
              entityId={calendarId}
              entityName="calendars"
              del={Calendars.updateCalendar}
              removeFollower={calendar.isPublic
                ? (id) => setParam({ target: { name: 'followers',
                  value: params.followers.filter(f => f.id !== id)
                }}) : undefined}
            />
            {calendar.isPublic &&
              <UserSearchForm
                label="Followers" name="followers" err={errors}
                chosen={params.followers}
                author={calendar.author}
                setChosen={setParam} 
                entityId={calendarId}
                entityName="calendars"
                del={Calendars.updateCalendar}
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

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title="Update" dis={load} />
      </form>
    </div>
  );
};

export default CalendarUpdatePage;
