import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import Events from '../api/eventsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import LoadPage from '../pages/LoadPage.jsx';
import { MainButton } from '../components';
import { AttentionIcon } from '../assets';
import '../pages/ContentPage.css';
import '../components/Forms.css';

const ParticipationConfirmationPage = () => {
  const navigate = useNavigate();

  const auth = useSelector(selectAuthUser.user);

  const { confirmToken } = useParams();
  const [searchParams] = useSearchParams();
  const [entity, setEntity] = useState(searchParams.get('entity') || 'calendar');

  const [load, setLoad] = useState(true);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [participation, setParticipation] = useState(null);

  useEffect(() => {
    if (confirmToken) {
      const Entity = entity === 'event' ? Events : Calendars;

      Entity.viewParticipation(confirmToken)
        .then(({ data: res }) => {
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
          setParticipation(res.data.calendar);
        })
        .catch((err) => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, []);

  const confirmParticipation = () => {
    if (confirmToken) {
      const Entity = entity === 'event' ? Events : Calendars;

      setLoad(true);
      Entity.confirmParticipation(confirmToken)
        .then(({ data: res }) => {
          setLoad(false);
          toast(res.message);
          navigate(`/calendars/${participation.id}`);
        })
        .catch((err) => {
          setLoad(false);
          if ((err.message).includes('already')) {
            toast(err.message);
            navigate(`/calendars/${participation.id}`);
          } else {
            setFeedback({ msg: err.message, status: 'fail' });
          }
        });
    }
  };

  const cancelParticipation = () => {
    if (confirmToken) {
      const cancel = entity === 'event' ? Events.deleteEvent : Calendars.deleteCalendar;

      setLoad(true);
      cancel(participation.id)
        .then(({ data: _res }) => {
          setLoad(false);
          navigate('/');
        })
        .catch((err) => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }
  };

  useEffect(() => {
    setEntity(searchParams.get('entity'));
  }, [confirmToken, searchParams]);

  if (!auth) return <Navigate to="/login" />
  if (!confirmToken) return <Navigate to="/" />

  return (
    <div className="center-container">
      <h1 className="basic-form-title">Participation Confirmation</h1>
      <div className="basic-form participation-confirmation">
        {!participation && load ? <LoadPage /> :
          (feedback.status === 'fail' ?
            <>
              <p className="basic-form-feedback fail">{feedback.msg?.replace('token', 'link')}</p>
              <AttentionIcon className="basic-form-result-icon fail" />
            </>
            : <div className="participation-confirmation">
                <div className="basic-form-note">
                  <Link to={`/users/${participation.author.id}`} className="pc-sender">{participation.author.login}</Link> invites you to be a participant of the {entity === 'event' ? 'event' : 'calendar'} <span className="pc-entity">{participation.name}</span>
                </div>
                <div className="pc-buttons-container">
                  <MainButton title="Confirm" short={true} onClick={confirmParticipation} dis={load} />
                  <MainButton title="Cancel" simple={true} onClick={cancelParticipation} dis={load} />
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ParticipationConfirmationPage;
