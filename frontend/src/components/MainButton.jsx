import './MainButton.css';

const MainButton = (
  {title, Icon, onClick, type = "submit", dis = false, square = false, small = false, short = false}
) => {
  return (
    <button
      className={`main-button${square ? " square" : ""}${small ? " small" : ""}${short ? " short" : ""}`}
      type={type}
      onClick={onClick}
      disabled={dis}
    >{title || <Icon />}</button>
  );
};

export default MainButton;
