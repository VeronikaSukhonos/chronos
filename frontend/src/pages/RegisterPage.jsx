import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { TextField, PasswordField, MainButton } from '../components';
import { useForm } from '../hooks';
import { Logo } from '../assets';
import valid from '../utils/validation.js';
import '../components/BasicForm.css';

const RegisterPage = () => {
  const auth = useSelector(selectAuthUser.user);

  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({login: '', email: '', password: '', passwordConfirmation: ''}, () => {
    return {
      login: valid.login(params),
      email: valid.email(params),
      password: valid.password(params),
      passwordConfirmation: valid.passwordConfirmation(params)
    };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Auth.register(params)
      .then(({ data: res }) => {
        setSuccess(res);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  return !auth ? (
    <div className="center-container">
      <div className="basic-form-title">Register to</div>
      <Logo />
      <div className="basic-form-title small">make every day count</div>

      <form className="basic-form" onSubmit={submit}>
        <TextField
          label="Login"
          onChange={setParam}
          id="login"
          val={params.login}
          err={errors}
          req={true}
          ac="username"
        />
        <TextField
          label="Email"
          onChange={setParam}
          id="email"
          val={params.email}
          err={errors}
          req={true}
          ac="email"
        />
        <PasswordField
          onChange={setParam}
          val={params.password}
          err={errors}
          req={true}
        />
        <PasswordField
          label="Password Confirmation"
          onChange={setParam}
          id="passwordConfirmation"
          val={params.passwordConfirmation}
          err={errors}
          req={true}
        />

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title="Register" dis={load} />

        <div className="basic-form-note">Already planning your days? <Link to="/login">Log in</Link></div>
      </form>
    </div>
  ) : <Navigate to="/" />;
};

export default RegisterPage;
