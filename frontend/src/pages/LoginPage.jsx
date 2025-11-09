import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuthUser.user);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data: res } = await Auth.login({ login, password });

      dispatch(setCredentials(res.data));
      setMessage(res.message);
      navigate('/');
    } catch (err) {
      setMessage(err.message);
    }
  }

  return !auth ? (
    <>
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Login"
          id="login"
          required={true}
          value={login}
          onChange={e => setLogin(e.target.value)}
        />
        <input
          type="text"
          placeholder="Password"
          id="password"
          required={true}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </>
  ) : <Navigate to="/" />;
};

export default LoginPage;
