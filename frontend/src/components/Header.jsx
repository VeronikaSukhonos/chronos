import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuthUser.user);

  const logout = async () => {
    try {
      await Auth.logout();
      dispatch(setCredentials());
      navigate('/login');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      Header
      {auth ? <button onClick={logout}>Logout</button> : ''}
    </div>
  );
};

export default Header;
