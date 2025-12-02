import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Users from '../api/usersApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import { UserList } from '../components';
import './SearchForms.css';
import './InputFields.css';

const SearchedUser = ({ user, onClick }) => {
  return (
    <div className="searched-user" onClick={onClick}>
      <img className="searched-user-avatar" src={`${import.meta.env.VITE_API_URL}${user?.avatar}`}
        alt={`${user?.login}'s avatar`} />
      {user?.email ? <div className="searched-user-email">{user?.email}</div> :
      <div className="searched-user-login">{user?.login}</div>}
    </div>
  );
};

const UserSearchForm = (
  { label, chosen = [], setChosen, notDeletable = [],
    req = false, resend, entityId, del, err, fOpen, removeFollower }
) => {
  const auth = useSelector(selectAuthUser.user);

  const [search, setSearch] = useState('');

  const [_, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [users, setUsers] = useState([]);

  const inputRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!search || search.trim() === '') {
      setLoad(false);
      setFeedback({ msg: '', status: '' });
      setUsers([]);
      return;
    }

    const wait = setTimeout(() => {
      setLoad(true);
      setFeedback({ msg: '', status: '' });
      Users.fetchUsers(`?login=${encodeURIComponent(search.trim())}&&limit=10`)
        .then(({ data: res }) => {
          setLoad(false);
          setFeedback({ msg: res.message, status: 'ok' });
          setUsers(res.data.users.filter(u => !chosen.some(ch => ch.id === u.id) && u.id !== auth.id));
        })
        .catch(err => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
          setUsers([]);
        });
    }, 300);

    return () => clearTimeout(wait);
  }, [search]);

  useEffect(() => {
    if (fOpen === false) setSearch('');
  }, [fOpen]);

  return (
    <div className="field user-search-form-container">
      {label && <span className={"field-label" + (req ? " required" : "")}>{label}</span>}
      <div className="field-container vertical">
        <UserList
          users={chosen} setUsers={setChosen} resend={resend} entityId={entityId}
          del={del} notDeletable={notDeletable}
        />

        {resend && <div className="user-search-form-add-container">
          <input
            type="text"
            onChange={(e) => setSearch(e.target.value)} value={search || ""}
            onBlur={() => {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = setTimeout(() => {
                setUsers([]);
                setFeedback({ msg: '', status: '' });
              }, 150);
            }}
            placeholder="Search users..." autoComplete="off" ref={inputRef}
          />
          {
            feedback.msg && <ul className="search-results users">
              {users.length > 0
                ? <>{users.map(u => <li key={`searcheduser${u.id}`}>
                    <SearchedUser user={u} onClick={() => {
                      inputRef.current?.focus();
                      setChosen([...chosen, {...u, isConfirmed: 'new'}]);
                      if (removeFollower) removeFollower(u.id);
                      setSearch('')}
                    } /></li>)}
                  </>
                : search && ((feedback.status === 'ok' ? <li className="info-message">No users found</li>
                  : <li className="info-message">{feedback.msg}</li>))}
            </ul>
          }
        </div>}
      </div>

      {err?.[resend ? 'participants' : 'followers']
        && <div className="field-err">{err[resend ? 'participants' : 'followers']}</div>}
    </div>
  );
};

export default UserSearchForm;
