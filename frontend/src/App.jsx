import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';

import Auth from './api/authApi.js';
import { setCredentials, selectAuthUser } from './store/authSlice.js';

import { Header } from './components';

import HomePage from './pages/HomePage.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EmailConfirmationPage from './pages/EmailConfirmationPage.jsx';
import PasswordResetPage from './pages/PasswordResetPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import UserSettingsPage from './pages/UserSettingsPage.jsx';
import ArchivePage from './pages/ArchivePage.jsx';
import EventCreatePage from './pages/EventCreatePage.jsx';
import EventPage from './pages/EventPage.jsx';
import LoadPage from './pages/LoadPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);

  const [load, setLoad] = useState(true);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });

  useEffect(() => {
    Auth.refresh()
      .then(({ data: res }) => {
        dispatch(setCredentials(res.data));
        setLoad(false);
        setFeedback({ msg: res.message, status: 'ok' });
      })
      .catch((err) => {
        dispatch(setCredentials());
        setLoad(false);
        setFeedback({ msg: err.message, status: 'fail' });
      });
  }, []);

  if (load) return <LoadPage spinner={false} />
  if (feedback.status === 'fail' && !feedback.msg.includes('token'))
    return <ErrorPage error={feedback.msg} />

  return (
    <>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={ auth ? <HomePage /> : <WelcomePage /> } />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/email-confirmation/:confirmToken" element={<EmailConfirmationPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/password-reset/:confirmToken" element={<PasswordResetPage />} />

          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/settings" element={<UserSettingsPage />} />
          <Route path="/archive" element={<ArchivePage />} />

          <Route path="/events/create" element={<EventCreatePage />} />
          <Route path="/events/:eventId" element={<EventPage />} />

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
