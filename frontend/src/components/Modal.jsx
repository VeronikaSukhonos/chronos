import { createPortal } from 'react-dom';

import './Modal.css';
import './Forms.css';

const Modal = ({ modalOpen, setModalOpen, title, children, onClose }) => {
  return createPortal(
    <div
      className={"modal-container " + (modalOpen ? "open" : "close")}
      onClick={() => {
        setModalOpen(false);
        if (onClose) onClose();
      }}
    >
      <div className="basic-form modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h1 className="basic-form-title">{ title }</h1>}
        {children}
      </div>
    </div>,
    document.getElementById('portal')
  );
};

export default Modal;
