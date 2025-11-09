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
import LoadPage from './pages/LoadPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  const dispatch = useDispatch();

  const [load, setLoad] = useState(false);

  useEffect(() => {
    Auth.refresh()
      .then(({ data: res }) => {
        dispatch(setCredentials(res.data));
        setLoad(true);
      })
      .catch(() => {
        dispatch(setCredentials());
        setLoad(true);
      });
  }, []);

  return !load ? <LoadPage /> : (
    <>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
