import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { selectAuthUser } from '../store/authSlice.js';
import { Calendar } from '../components';

function HomePage() {
  const auth = useSelector(selectAuthUser.user);

  if (!auth) return <Navigate to="login" />

  return (
    <div className="home-page-container">
      <div className="side-panel">

      </div>
      <Calendar />
    </div>
  );
}

export default HomePage;
