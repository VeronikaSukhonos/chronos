import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { selectAuthUser } from '../store/authSlice.js';
import { AttentionIcon } from '../assets';
import '../components/MainButton.css';

const NotFoundPage = () => {
  const auth = useSelector(selectAuthUser.user);

  return (
    <div className="center-container">
      <AttentionIcon />
      <p className="error-page-description">We searched through past, present and future... but this page doesn't exist :(</p>
      {
        auth
          ? <Link className="main-button" to="/">Back to Home</Link>
          : <Link className="main-button" to="/login">Back to Login</Link>
      }
    </div>
  )
}

export default NotFoundPage;
