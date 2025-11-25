import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';

import Users from '../api/usersApi.js';
import { selectAuthUser, setCredentials, updateAuthUser } from '../store/authSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import {
  AvatarMenu, TextField, DateField, PasswordField, MainButton, AccordionMenu
} from '../components';
import { useForm } from '../hooks';
import valid from '../utils/validation.js';
import './UserProfilePage.css';
import '../components/BasicForm.css';

const EmailUpdate = () => {
  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({ password: '', email: '' }, () => {
    return {
      password: (() => params.password ? '' : 'Password is required')(),
      email: valid.email(params)
    };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Users.updateEmail(params)
      .then(({ data: res }) => {
        setSuccess(res);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  return (
    <form className="basic-form transparent" onSubmit={submit}>
      <PasswordField
        id="pw-email" name="password"
        label="Current Password"
        onChange={setParam}
        val={params.password}
        err={errors}
        req={true}
        ac="current-password"
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

      {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

      <MainButton title="Update" dis={load} />
    </form>
  );
};

const PasswordUpdate = () => {
  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({curPassword: '', password: '', passwordConfirmation: ''}, () => {
    return {
      curPassword: (() => params.curPassword ? '' : 'Current Password is required')(),
      password: valid.password(params),
      passwordConfirmation: valid.passwordConfirmation(params)
    };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Users.updatePassword(params)
      .then(({ data: res }) => {
        setSuccess(res);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  return (
    <form className="basic-form transparent" onSubmit={submit}>
      <PasswordField
        label="Current Password"
        onChange={setParam}
        id="curPassword"
        val={params.curPassword}
        err={errors}
        req={true}
        ac="current-password"
      />
      <PasswordField
        id="pw-pw" name="password"
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

      <MainButton title="Update" dis={load} />
    </form>
  );
};

const ProfileDelete = () => {
  const dispatch = useDispatch();

  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({password: ''}, () => {
    return { password: (() => params.password ? '' : 'Password is required')() };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Users.deleteProfile(params)
      .then(({ data: res }) => {
        setSuccess(res);
        dispatch(setCredentials());
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  return (
    <form className="basic-form transparent" onSubmit={submit}>
      <div className="warning">We are sad to see you go. If you are sure about deleting your profile, all data connected to it will be deleted permanently. You cannot undo this action.</div>

      <PasswordField
        id="pw-delete" name="password"
        onChange={setParam}
        val={params.password}
        err={errors}
        req={true}
        ac="current-password"
      />

      {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

      <MainButton title="Delete" dis={load} />
    </form>
  );
};

const UserSettingsPage = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const avatarLoad = useSelector(selectAuthUser.avatarLoad);

  const [initLoad, setInitLoad] = useState(true);
  const [initFeedback, setInitFeedback] = useState({ msg: '', status: '' });

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const {
    params, setParam, load, feedback, errors, resetForm, setSuccess, setFailure
  } = useForm({login: auth?.login, fullName: auth?.fullName || '', dob: auth?.dob || ''}, () => {
    return {
      login: valid.login(params),
      fullName: valid.fullName(params),
      dob: valid.dob(params)
    };
  }, false);

  const setInitParams = (res) => {
    setParam({ target: { name: 'login', value: res.data.user.login } });
    setParam({ target: { name: 'fullName', value: res.data.user.fullName || '' } });
    setParam({ target: { name: 'dob', value: res.data.user.dob || '' } });
    dispatch(updateAuthUser(res.data.user));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    Users.updateProfile(params)
      .then(({ data: res }) => {
        if (res.data?.user) setInitParams(res);
        setSuccess(res);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  useEffect(() => {
    if (auth?.id) {
      Users.fetchUser(auth?.id)
        .then(({ data: res }) => {
          setInitParams(res);
          setInitLoad(false);
          setInitFeedback({ msg: res.message, status: 'ok' });
        })
        .catch((err) => {
          setInitLoad(false);
          setInitFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, [auth?.id]);

  if (!auth) return <Navigate to="/" />
  if (initLoad) return <LoadPage />
  if (initFeedback.status === 'fail')
    return <ErrorPage error={initFeedback.msg} />

  return (
    <div className="horizontal center-container">
      <h1 className="basic-form-title">Settings</h1>
      <AccordionMenu
        defaultOpenItems={[0]}
        items={[
          {
            title: "Update Profile",
            content:
              <div className="center-container">
                <div className="profile-avatar-container">
                  <img
                    className={"profile-avatar self" + (avatarLoad ? " load" : "")}
                    onClick={() => setAvatarMenuOpen(true)}
                    src={`${import.meta.env.VITE_API_URL}${auth?.avatar}`}
                    alt="My avatar"
                  />
                  <MainButton
                    title="Update"
                    type="button"
                    short={true}
                    onClick={() => setAvatarMenuOpen(true)}
                    dis={avatarLoad}
                  />
                </div>

                <form className="basic-form transparent" onSubmit={submit}>
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
                    label="Full Name"
                    onChange={setParam}
                    id="fullName"
                    val={params.fullName}
                    err={errors}
                    ac="name"
                  />
                  <DateField
                    label="Date of Birth"
                    onChange={setParam}
                    id="dob"
                    val={params.dob}
                    err={errors}
                    ac="bday"
                  />

                  {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

                  <MainButton title="Save" dis={load} />
                </form>
              </div>
          },
          {title: "Update Email", content: <EmailUpdate />},
          {title: "Update Password", content: <PasswordUpdate />},
          {title: "Delete Profile", content: <ProfileDelete />}
        ]}
      />
      <AvatarMenu avatarMenuOpen={avatarMenuOpen} setAvatarMenuOpen={setAvatarMenuOpen} />
    </div>
  );
};

export default UserSettingsPage;
