import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { selectAuthUser } from '../store/authSlice.js';
import { MainButton } from '../components';
import { ConfirmIcon, AddIcon, QuestionIcon } from '../assets';

const UserList = ({ users, name, setUsers, author, resend, del, entityId, entityName = 'calendars', notDeletable = [] }) => {
  const auth = useSelector(selectAuthUser.user);
  const [load, setLoad] = useState(false);

  const reinviteUser = (user) => {
    setLoad(true);
    resend(entityId, {participantId: user.id})
      .then(({ data: res }) => {
        setLoad(false);
        setUsers(users.map(u => u.id === user.id ? { ...u, isConfirmed: 'sent' } : u));
        toast(res.message);
      })
      .catch((err) => {
        setLoad(false);
        toast(err.message);
      })
  };

  const deleteUser = (user) => {
    const left = users.filter(u => u.id !== user.id);

    if (user.isConfirmed !== 'new') {
      setLoad(true);
      del(entityId, resend ? { participants: left.map(u => u.id) }
        : { followers: left.map(u => u.id) })
        .then(() => {
          setLoad(false);
          setUsers(left);
          toast(`Removed ${name.slice(0, -1)} successfully`);
        })
        .catch((err) => {
          setLoad(false);
          toast(err.message);
        })
    } else {
      setUsers(left);
      toast(`Removed ${name.slice(0, -1)} successfully`);
    }
  };

  return users.length > 0 ? (
    <div className={"user-list" + (load ? ' disabled' : '')}>
      {
        users.map((u) => {
          return <div className="user-list-user" key={u.id}>
            <Link to={`/users/${u.id}`}>
              <img
                className="user-list-user-avatar"
                src={`${import.meta.env.VITE_API_URL}${u.avatar}`}
                alt={`${u.login}'s avatar`}
              />
              <div className="user-list-user-login">{u.login}</div>
            </Link>
            {auth.id === author?.id && !notDeletable.find(nd => nd.id === u.id)
              && <div className="user-list-buttons-container">
              {
                resend && <div className="user-list-confirmed">
                  {![true, 'sent', 'new'].includes(u.isConfirmed) && <MainButton
                    title="Reinvite" onClick={() => reinviteUser(u)}
                    type="button" short={true} small={true} dis={load}
                  />}
                  {u.isConfirmed === 'new' && 'new'}
                  {u.isConfirmed === 'sent' && 'reinvited'}
                  {u.isConfirmed === true
                    ? <ConfirmIcon className="user-list-confirmed-icon" />
                    : <QuestionIcon className="user-list-confirmed-icon" />}
                </div>
              }
              <button type="button" className="user-list-delete" onClick={() => deleteUser(u)} disabled={load}>
                <AddIcon />
              </button>
            </div>}
            {(() => {
              const role = notDeletable.find(nd => nd.id === u.id)?.role;
              if (role) return <div className="user-list-role">{role}</div>
            })()}
          </div>
        })
      }
    </div>
  ) : (entityName === 'calendars'
      ? <div className="info-message left">No {name} in this calendar</div> :
        <div className="info-message left">This event is public</div>);
};

export default UserList;
