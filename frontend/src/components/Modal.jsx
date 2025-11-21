import './Modal.css';
import './BasicForm.css';

const Modal = ({ modalOpen, setModalOpen, title, children }) => {
  return (
    <div
      className={"modal-container " + (modalOpen ? "open" : "close")}
      onClick={() => setModalOpen(false)}
    >
      <div className="basic-form modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h1 className="basic-form-title">{ title }</h1>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
