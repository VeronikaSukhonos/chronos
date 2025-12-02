import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Navigate, useParams } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, updateAuthUser } from '../store/authSlice.js';
import LoadPage from '../pages/LoadPage.jsx';
import { TextField, MainButton } from '../components';
import { useForm } from '../hooks';
import { Logo, ConfirmIcon, AttentionIcon } from '../assets';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const EmailConfirmationPage = () => {
  const dispatch = useDispatch();

  const { confirmToken } = useParams();

  const auth = useSelector(selectAuthUser.user);

  const requestEmConf = useForm({email: ''}, () => {
    return {
      login: (() => requestEmConf.params.login ? '' : 'Login is required')(),
      email: (() => requestEmConf.params.email
        ? valid.email(requestEmConf.params) : '')()
    };
  });

  const [load, setLoad] = useState(true);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });

  const submitRequest = (e) => {
    e.preventDefault();
    if (!requestEmConf.resetForm()) return;

    Auth.emailConfirmationRequest(requestEmConf.params)
      .then(({ data: res }) => {
        requestEmConf.setSuccess(res);
      })
      .catch((err) => {
        requestEmConf.setFailure(err);
      });
  };

  useEffect(() => {
    if (confirmToken) {
      Auth.emailConfirmationConfirm(confirmToken)
        .then(({ data: res }) => {
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
          dispatch(updateAuthUser(res.data));
        })
        .catch((err) => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, []);

  if (auth && !confirmToken) return <Navigate to="/" />;

  return !confirmToken ? (
    <div className="center-container">
      <Logo />
      <h1 className="basic-form-title">Request Email Confirmation</h1>

      <form className="basic-form" onSubmit={submitRequest}>
        <TextField
          label="Login"
          onChange={requestEmConf.setParam}
          id="login"
          val={requestEmConf.params.login}
          err={requestEmConf.errors}
          req={true}
          ac="username"
        />
        <TextField
          label="Registered or New Email"
          onChange={requestEmConf.setParam}
          id="email"
          val={requestEmConf.params.email}
          err={requestEmConf.errors}
          ac="email"
        />

        {requestEmConf.feedback && <p className={"basic-form-feedback " + (requestEmConf.feedback.status)}>
          {requestEmConf.feedback.msg}</p>}

        <MainButton title="Send Link" dis={requestEmConf.load} />

        <div className="basic-form-note"><Link to="/login">Back to Login</Link></div>
      </form>
    </div>
  ) : (
    <div className="center-container">
      {!auth && <Logo />}
      <h1 className="basic-form-title">Email Confirmation</h1>

      <div className="basic-form">
        {
          load ? <LoadPage />
            : (feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>)}
        {
          feedback.status === 'ok'
            ? <ConfirmIcon className="basic-form-result-icon ok" />
            : (feedback.status === 'fail' && <AttentionIcon className="basic-form-result-icon fail" />)
        }
        {
          feedback.msg.includes("link") && <div className="basic-form-note">
            <Link to={!auth ? "/email-confirmation" : "/settings"}>Want to request a new link?</Link>
          </div>
        }
        {
          auth
            ? <div className="basic-form-note"><Link to="/">Back to Home</Link></div>
            : <div className="basic-form-note"><Link to="/login">Back to Login</Link></div>
        }
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
