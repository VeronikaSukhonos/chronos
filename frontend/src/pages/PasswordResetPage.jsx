import { useSelector } from 'react-redux';
import { Link, Navigate, useParams } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { TextField, PasswordField, MainButton } from '../components';
import { useForm } from '../hooks';
import { Logo } from '../assets';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const PasswordResetPage = () => {
  const { confirmToken } = useParams();

  const auth = useSelector(selectAuthUser.user);

  const requestPwR = useForm({email: ''}, () => {
    return { email: (() => requestPwR.params.email ? '' : 'Email is required')() };
  });

  const confirmPwR = useForm({password: '', passwordConfirmation: ''}, () => {
    return {
      password: valid.password(confirmPwR.params),
      passwordConfirmation: valid.passwordConfirmation(confirmPwR.params)
    };
  });

  const submitRequest = (e) => {
    e.preventDefault();
    if (!requestPwR.resetForm()) return;

    Auth.passwordResetRequest(requestPwR.params)
      .then(({ data: res }) => {
        requestPwR.setSuccess(res);
      })
      .catch((err) => {
        requestPwR.setFailure(err);
      });
  };

  const submitConfirm = (e) => {
    e.preventDefault();
    if (!confirmPwR.resetForm()) return;

    Auth.passwordResetConfirm(confirmPwR.params, confirmToken)
      .then(({ data: res }) => {
        confirmPwR.setSuccess(res);
      })
      .catch((err) => {
        confirmPwR.setFailure(err);
      });
  };

  if (auth) return <Navigate to="/" />;

  return !confirmToken ? (
    <div className="center-container">
      <Logo />
      <h1 className="basic-form-title">Request Password Reset</h1>

      <form className="basic-form" onSubmit={submitRequest}>
        <TextField
          label="Email"
          onChange={requestPwR.setParam}
          id="email"
          val={requestPwR.params.email}
          err={requestPwR.errors}
          req={true}
          ac="email"
        />

        {requestPwR.feedback && <p className={"basic-form-feedback " + (requestPwR.feedback.status)}>
          {requestPwR.feedback.msg}</p>}

        <MainButton title="Send Link" dis={requestPwR.load} />

        <div className="basic-form-note"><Link to="/login">Back to Login</Link></div>
      </form>
    </div>
  ) : (
    <div className="center-container">
      <Logo />
      <h1 className="basic-form-title">Password Reset</h1>

      <form className="basic-form" onSubmit={submitConfirm}>
        <PasswordField
          onChange={confirmPwR.setParam}
          val={confirmPwR.params.password}
          err={confirmPwR.errors}
          req={true}
        />
        <PasswordField
          label="Password Confirmation"
          onChange={confirmPwR.setParam}
          id="passwordConfirmation"
          val={confirmPwR.params.passwordConfirmation}
          err={confirmPwR.errors}
          req={true}
        />

        {confirmPwR.feedback && <p className={"basic-form-feedback " + (confirmPwR.feedback.status)}>
          {confirmPwR.feedback.msg}</p>}

        <MainButton title="Reset" dis={confirmPwR.load} />

        {
          confirmPwR.feedback.msg.includes("link") && <div className="basic-form-note">
            <Link to="/password-reset">Want to request a new link?</Link>
          </div>
        }
        <div className="basic-form-note"><Link to="/login">Back to Login</Link></div>
      </form>
    </div>
  );
};

export default PasswordResetPage;
