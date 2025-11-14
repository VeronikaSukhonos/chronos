import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';

import Auth from './api/authApi.js';
import { setCredentials } from './store/authSlice.js';

import { Header } from './components';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EmailConfirmationPage from './pages/EmailConfirmationPage.jsx';
import PasswordResetPage from './pages/PasswordResetPage.jsx';
import LoadPage from './pages/LoadPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  const dispatch = useDispatch();

  const [load, setLoad] = useState(true);

  useEffect(() => {
    Auth.refresh()
      .then(({ data: res }) => {
        dispatch(setCredentials(res.data));
        setLoad(false);
      })
      .catch((err) => {
        dispatch(setCredentials());
        setLoad(false);
        console.log(err.message);
      });
  }, []);

  return load ? <LoadPage /> : (
    <>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/email-confirmation/:confirmToken" element={<EmailConfirmationPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/password-reset/:confirmToken" element={<PasswordResetPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        closeOnClick={true}
        hideProgressBar={true}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        draggable={false}
        limit={1}
        transition={Slide}
      />
    </>
  );
};

export default App;
