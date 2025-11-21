import { useSelector } from 'react-redux';

import { selectAuthUser } from '../store/authSlice.js';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import { Logo, AttentionIcon } from '../assets';

const ErrorPage = ({ error, entity = "page" }) => {
  const auth = useSelector(selectAuthUser.user);

  if (error.includes('not found'))
    return <NotFoundPage entity={entity} />
  else
    return (
      <div className="center-container">
        {!auth && <Logo />}
        <AttentionIcon />
        <p className="error-page-description">We wish we could go back in time to fix this :( {error}</p>
      </div>
    );
};

export default ErrorPage;
