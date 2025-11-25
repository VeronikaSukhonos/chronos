import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import Auth from '../api/authApi.js';
import { selectAuthUser, setCredentials } from '../store/authSlice.js';
import { MainButton, EventSearchForm } from '../components';
import { useClickOutside } from '../hooks';
import {
  Logo, SearchIcon, AddIcon, ProfileIcon, SettingsIcon, ArchiveIcon, LogoutIcon
} from '../assets';
import './Header.css';
import './DropdownMenu.css';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector(selectAuthUser.user);
  const avatarLoad = useSelector(selectAuthUser.avatarLoad);

  const [search, setSearch] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const authContainerRef = useRef(null);

  const doSearch = (e) => {
    e.preventDefault();
    console.log('Searching...'); // TODO
  };

  const openEventCreateForm = () => {
    console.log('Event creation form opens...'); // TODO
  };

  const logout = async () => {
    try {
      await Auth.logout();
      dispatch(setCredentials());
      navigate('/login');
    } catch (err) { console.error(err); }
  };

  useClickOutside([searchContainerRef], () => { if (searchOpen) setSearchOpen(() => false); });
  useClickOutside([authContainerRef], () => { if (authMenuOpen) setAuthMenuOpen(false); });

  if (!auth) return <></>

  return (
    <header>
      <nav>
        <Link className="logo" to="/">
          <Logo />
        </Link>

        <div className="search-container" ref={searchContainerRef}>
          <EventSearchForm
            id="search"
            onSubmit={doSearch}
            search={search}
            setSearch={setSearch}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
          />
          <div className="main-button square search-icon-container" onClick={() => setSearchOpen(open => !open)}>
            <SearchIcon className="search-icon" />
          </div>
        </div>

        <MainButton Icon={AddIcon} onClick={openEventCreateForm} type="button" square={true} />

        <div className="dropdown-menu-container" ref={authContainerRef}>
          <div className="dropdown-menu-button" onClick={() => setAuthMenuOpen((open) => !open)}>
            <img
              className={"avatar" + (avatarLoad ? " load" : "")}
              src={`${import.meta.env.VITE_API_URL}${auth.avatar}`}
              alt="My avatar"
            />
          </div>
          <ul className={authMenuOpen ? "open" : "close"}>
            <li className="dropdown-menu-important"><div>{auth.login}</div></li>
            <li>
              <NavLink to={`/users/${auth.id}`} end onClick={() => setAuthMenuOpen(false)}>
                <ProfileIcon /><div>Profile</div>
              </NavLink>
            </li>
            <li>
              <NavLink to={"/settings"} onClick={() => setAuthMenuOpen(false)}>
                <SettingsIcon /><div>Settings</div>
              </NavLink>
            </li>
            <li>
              <NavLink to={"/archive"} onClick={() => setAuthMenuOpen(false)}>
                <ArchiveIcon /><div>Archive</div>
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={logout}><LogoutIcon /><div>Log Out</div></button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
