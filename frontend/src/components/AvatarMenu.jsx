import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Users from '../api/usersApi.js';
import { selectAuthUser, updateAuthUser, setAvatarLoad } from '../store/authSlice.js';
import { Modal } from '../components';
import { UploadIcon, DeleteIcon } from '../assets';

const AvatarMenu = ({ avatarMenuOpen, setAvatarMenuOpen }) => {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);

  const uploadAvatar = (e) => {
    if (e.target.id === 'upload-avatar') {
      const avatar = e.target.files[0];

      if (avatar) {
        const fd = new FormData();

        fd.append('avatar', avatar);
        e.target.value = '';
        setAvatarMenuOpen(false);
        dispatch(setAvatarLoad(true));
        Users.uploadAvatar(fd)
          .then(({ data: res }) => {
            dispatch(updateAuthUser(res.data));
            dispatch(setAvatarLoad(false));
            toast(res.message);
          }).catch((err) => {
            dispatch(setAvatarLoad(false));
            toast(err.message);
          });
      }
    } else {
      setAvatarMenuOpen(false);
      dispatch(setAvatarLoad(true));
      Users.deleteAvatar()
        .then(({ data: res }) => {
          dispatch(updateAuthUser(res.data));
          dispatch(setAvatarLoad(false));
          toast(res.message);
        }).catch((err) => {
          dispatch(setAvatarLoad(false));
          toast(err.message);
        });
    }
  };

  return (
    <Modal
      modalOpen={avatarMenuOpen}
      setModalOpen={setAvatarMenuOpen}
      title="Avatar"
    >
      <label className="modal-item" htmlFor="upload-avatar">
        Upload New<UploadIcon />
      </label>
      <input type="file" id="upload-avatar" name="avatar"
        style={{ display: "none" }} accept="image/png, image/jpeg"
        onChange={uploadAvatar}
      />
      {
        !auth?.avatar.includes('default') &&
          <span className="modal-item" id="delete-avatar" onClick={uploadAvatar}>
            Delete<DeleteIcon />
          </span>
      }
      <span className="modal-item" onClick={() => setAvatarMenuOpen(false)}>
        Cancel
      </span>
    </Modal>
  );
};

export default AvatarMenu;
