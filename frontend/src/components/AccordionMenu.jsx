import { useState } from 'react';

import { ArrowIcon } from '../assets';
import './AccordionMenu.css';
import './BasicForm.css';

const AccordionItem = ({ title, content, itemOpen, onClick, button }) => {
  return (
    <div className={"accordion-item " + (itemOpen ? "open" : "close")}>
      <div className="accordion-title" onClick={onClick}>
        <ArrowIcon className="arrow" />
        <h2 className="basic-form-title small">{title}</h2>
        {button || ''}
      </div>
      <div className="accordion-content">
        {content}
      </div>
    </div>
  );
};

const AccordionMenu = ({ defaultOpenItems = [], items = [] }) => {
  const [openItems, setOpenItems] = useState(defaultOpenItems);

  const openClose = (item) => {
    setOpenItems(
      (oi) => oi.includes(item) ? oi.filter(i => i !== item) : [...oi, item]
    );
  };

  return (
    <div className="accordion-menu">
      {items.map((item, i) => {
        return <AccordionItem
          title={item.title}
          content={item.content}
          key={i}
          itemOpen={openItems.includes(i)}
          onClick={() => openClose(i)}
          button={item.button}
        />
      })}
    </div>
  );
};

export default AccordionMenu;
