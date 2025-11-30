import { DotsIcon } from '../assets';
import './Buttons.css';

export const MainButton = (
  {
    title = '', Icon, onClick, type = "submit", dis = false,
    square = false, small = false, short = false, simple = false, nav = false
  }
) => {
  return (
    <button
      className={
        `main-button${square ? " square" : ""}
        ${small ? " small" : ""}
        ${short ? " short" : ""}
        ${simple ? " simple" : ""}
        ${nav ? " nav" : ""}`
      }
      type={type}
      onClick={onClick}
      disabled={dis}
    >{Icon ? <Icon /> : title}</button>
  );
};

export const MenuButton = ({ onClick, dis = false }) => {
  return (
    <button
      className="menu-button" type="button" onClick={onClick} disabled={dis}
    ><DotsIcon /></button>
  );
};
