import { Link } from 'react-router-dom';

import { Logo } from '../assets';
import './HomePage.css';
import '../components/Buttons.css';

const WelcomePage = () => {
  return (
    <div className="center-container welcome-page">
      <Link to="/"><Logo /></Link>
      <div className="welcome-statement">Make every day count!</div>
      <div className="welcome-message">Planning service that helps you manage tasks, set reminders and organize arrangements across multiple calendars.</div>
      <div className="buttons-container">
        <Link className="main-button" to="/login">Log In</Link>
        <Link className="main-button" to="/register">Register</Link>
      </div>
    </div>
  );
};

export default WelcomePage;
