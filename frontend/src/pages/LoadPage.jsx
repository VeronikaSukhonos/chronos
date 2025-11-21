import { Logo, Spinner } from '../assets';

const LoadPage = ({spinner = true}) => {
  if (spinner)
    return <div className="center-container"><Spinner className="spinner" /></div>;
  return <div className="center-container"><Logo /></div>;
};

export default LoadPage;
