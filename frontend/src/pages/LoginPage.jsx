import { useSelector, useDispatch } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';
import { TextField, PasswordField, MainButton } from '../components';
import { useForm } from '../hooks';
import { Logo } from '../assets';
import '../components/Forms.css';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector(selectAuthUser.user);

  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({login: '', password: ''}, () => {
    return {
      login: (() => params.login ? '' : 'Login is required')(),
      password: (() => params.password ? '' : 'Password is required')()
    };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Auth.login(params)
      .then(({ data: res }) => {
        setSuccess(res);
        dispatch(setCredentials(res.data));
        navigate('/');
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  return !auth ? (
    <div className="center-container">
      <h1 className="basic-form-title">Log in to</h1>
      <Link to="/"><Logo /></Link>

      <form className="basic-form" onSubmit={submit}>
        <TextField
          label="Login or Email"
          onChange={setParam}
          id="login"
          val={params.login}
          err={errors}
          req={true}
          ac="username"
        />
        <PasswordField
          id="password"
          onChange={setParam}
          val={params.password}
          err={errors}
          req={true}
          ac="current-password"
        />

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}
        {feedback.msg && feedback.msg.includes('not confirmed') && <div className="basic-form-note"><Link to="/email-confirmation">Registered with a wrong email?</Link></div>}

        <MainButton title="Log In" dis={load} />

        <div className="basic-form-note"><Link to="/password-reset">Forgot your password?</Link></div>
        <div className="basic-form-note">First time here to plan smarter? <Link to="/register">Register</Link></div>
      </form>
    </div>
  ) : <Navigate to="/" />;
};

export default LoginPage;
