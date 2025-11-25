import { Logo, Spinner } from '../assets';

const LoadPage = ({spinner = true, small = false}) => {
  if (spinner)
    return <div className="center-container">
      <Spinner className={"spinner" + (small ? " small" : "")} />
    </div>;
  return <div className="center-container"><Logo /></div>;
};

export default LoadPage;
