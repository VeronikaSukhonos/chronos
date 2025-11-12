import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';
import { TextField, PasswordField, MainButton } from '../components';
import { Logo } from '../assets';
import '../components/BasicForm.css';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector(selectAuthUser.user);

  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [load, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setLoad(true);
    setFeedback({ msg: '', status: '' });
    setErrors({});
    try {
      const { data: res } = await Auth.register({ login, email, password });

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
      <h1 className="basic-form-title">Register to</h1>
      <Logo />
      <div className="basic-form-title small">make every day count</div>

      <form className="basic-form" onSubmit={submit}>
        <TextField
          label="Login"
          onChange={e => setLogin(e.target.value)}
          id="login"
          val={login}
          err={errors}
          req={true}
          ac="username"
        />
        <TextField
          label="Email"
          onChange={e => setEmail(e.target.value)}
          id="email"
          val={email}
          err={errors}
          req={true}
          ac="email"
        />
        <PasswordField
          onChange={e => setPassword(e.target.value)}
          val={password}
          err={errors}
          req={true}
        />
        {/* <PasswordField
          label="Password Confirmation"
          onChange={e => setPasswordConfirmation(e.target.value)}
          val={passwordConfirmation}
          req={true}
        /> */}

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title="Register" />

        <div className="basic-form-note">Already planning your days? <Link to="/login">Log in</Link></div>
      </form>
    </div>
  ) : <Navigate to="/" />;
};

export default RegisterPage;
