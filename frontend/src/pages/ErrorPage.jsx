import { useSelector } from 'react-redux';

import { selectAuthUser } from '../store/authSlice.js';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import { Logo, AttentionIcon } from '../assets';

const ErrorPage = ({ error, entity = "page" }) => {
  const auth = useSelector(selectAuthUser.user);

  if (error.includes('not found'))
    return <NotFoundPage entity={entity} />
  else if (error.includes('have access'))
    return <div className="center-container">
      <AttentionIcon />
      <p className="error-page-description">We looked across past, present and future... but you don't have access to this {entity} :(</p>
    </div>
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
