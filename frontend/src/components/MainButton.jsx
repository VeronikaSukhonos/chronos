import './MainButton.css';

const MainButton = ({title, Icon, onClick, type = 'submit', square = false}) => {
  return (
    <button
      className={`main-button${square ? ' square' : ''}`}
      type={type}
      onClick={onClick}
    >{title || <Icon />}</button>
  );
};

export default MainButton;
