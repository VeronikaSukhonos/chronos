import { useEffect } from 'react';

const useClickOutside = (refs, cb) => {
  useEffect(() => {
    const handleClick = (e) => {
      let outside = true;

      for (const ref of refs)
        if (ref.current && ref.current.contains(e.target)) outside = false;

      if (outside) cb();
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    }
  }, [refs, cb]);
};

export default useClickOutside;
