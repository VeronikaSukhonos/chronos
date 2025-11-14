import './MainButton.css';

const MainButton = ({title, Icon, onClick, type = 'submit', square = false, dis = false}) => {
  return (
    <button
      className={`main-button${square ? ' square' : ''}`}
      type={type}
      onClick={onClick}
      disabled={dis}
    >{title || <Icon />}</button>
  );
};

export default MainButton;
