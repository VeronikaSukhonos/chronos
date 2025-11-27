import { Link } from 'react-router-dom';

import { AttentionIcon } from '../assets';
import '../components/Buttons.css';

const NotFoundPage = ({ entity = "page" }) => {
  return (
    <div className="center-container">
      <AttentionIcon />
      <p className="error-page-description">We searched through past, present and future... but this {entity} doesn't exist :(</p>
      <Link className="main-button short" to="/">Back to Home</Link>
    </div>
  )
}

export default NotFoundPage;
