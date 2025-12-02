import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link, Navigate } from 'react-router-dom';

import Users from '../api/usersApi.js';
import { selectAuthUser, updateAuthUser } from '../store/authSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { MainButton, AvatarMenu } from '../components';
import { SettingsIcon, ArchiveIcon, BirthdayIcon, AddIcon } from '../assets';
import { fBirthday } from '../utils/formatDate.js';
import './UserProfilePage.css';
import '../components/Forms.css';

const UserProfilePage = () => {
  const { userId } = useParams();

  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);
  const avatarLoad = useSelector(selectAuthUser.avatarLoad);

  const [load, setLoad] = useState(true);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [user, setUser] = useState(null);

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const openEventCreateForm = () => {
    console.log('Event creation form opens with prefilled values for birthday...'); // TODO
  };

  useEffect(() => {
    if (userId) {
      Users.fetchUser(userId)
        .then(({ data: res }) => {
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
          setUser(res.data.user);
          if (userId === auth.id) dispatch(updateAuthUser(res.data.user));
        })
        .catch((err) => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
        });
    }
  }, [userId]);

  if (!auth) return <Navigate to="/login" />
  if (load) return <LoadPage />
  if (feedback.status === 'fail')
    return <ErrorPage error={feedback.msg} entity="user" />

  return (
    <div className={(user?.publicCalendars?.length ? "horizontal " : "") + "center-container"}>
      <div className="basic-form profile-container">
        <img
          className={"profile-avatar" + (userId === auth.id ? " self" : "") + (avatarLoad ? " load" : "")}
          onClick={() => { if (userId === auth.id) setAvatarMenuOpen(true)}}
          src={`${import.meta.env.VITE_API_URL}${userId === auth.id ? auth?.avatar : user?.avatar}`}
          alt={`${user?.login}'s avatar`}
        />
        <div className="login">{user?.login}</div>
        {user?.fullName && <div className="full-name">{user?.fullName}</div>}
        {user?.email && <div className="email">{user?.email}</div>}
        {
          user?.dob && <div className="dob line">
            <BirthdayIcon />
            {fBirthday(user?.dob)}
            <MainButton Icon={AddIcon} small={true} onClick={openEventCreateForm} type="button" />
          </div>
        }
        {
          userId === auth.id
            && <div className="line">
              <Link className="link-button" to="/settings"><SettingsIcon />Settings</Link>
              <Link className="link-button" to="/archive"><ArchiveIcon />Archive</Link>
            </div>
        }
      </div>
      <AvatarMenu avatarMenuOpen={avatarMenuOpen} setAvatarMenuOpen={setAvatarMenuOpen} />
    </div>
  );
};

export default UserProfilePage;
