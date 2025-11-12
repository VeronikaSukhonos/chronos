import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';
import { TextField, PasswordField, MainButton } from '../components';
import { Logo } from '../assets';
import '../components/BasicForm.css';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector(selectAuthUser.user);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [load, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setLoad(true);
    setFeedback({ msg: '', status: '' });
    setErrors({});
    try {
      const { data: res } = await Auth.login({ login, password });

      setLoad(false);
      setFeedback({ msg: res.message, status: 'ok' });
      dispatch(setCredentials(res.data));
      navigate('/');
    } catch (err) {
      setLoad(true);
      if (err.errors) setErrors(err.errors);
      else setFeedback({ msg: err.message, status: 'fail' });
    }
  }

  return !auth ? (
    <div className="center-container">
      <h1 className="basic-form-title">Log in to</h1>
      <Logo />

      <form className="basic-form" onSubmit={submit}>
        <TextField
          label="Login or Email"
          onChange={e => setLogin(e.target.value)}
          id="login"
          val={login}
          err={errors}
          req={true}
          ac="username"
        />
        <PasswordField
          onChange={e => setPassword(e.target.value)}
          val={password}
          err={errors}
          req={true}
          ac="current-password"
        />

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title="Log In" />

        <div className="basic-form-note"><Link to="/password-reset">Forgot your password?</Link></div>
        <div className="basic-form-note">First time here to plan smarter? <Link to="/register">Register</Link></div>
      </form>
    </div>
  ) : <Navigate to="/" />;
};

export default LoginPage;
