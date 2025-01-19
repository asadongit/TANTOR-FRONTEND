import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HistoryTracker = () => {
  const location = useLocation();
  const [historyStack, setHistoryStack] = useState([]);

  useEffect(() => {
    const currentPageName = getPageName(location.pathname);
    if (!historyStack.includes(currentPageName)) {
      setHistoryStack(prevStack => [...prevStack, currentPageName]);
    }

    const handlePopState = () => {
      const currentPageName = getPageName(location.pathname);
      setHistoryStack([currentPageName]);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location, setHistoryStack]);

  const getPageName = (pathname) => {
    const pageMapping = {
      '/': 'Platform',
      '/project': 'Project',
      '/dataGovernance': 'Data Governance',
      // Add more mappings as needed
    };
    return pageMapping[pathname] || pathname;
  };

  const renderHistory = () => {
    return historyStack.map((page, index) => (
      <span
        key={index}
        className={page === historyStack[historyStack.length - 1] ? 'active' : 'inactive'}
      >
        {index > 0 && ' > '}
        {page}
      </span>
    ));
  };

  return (
    <div>
      <p>{historyStack.length > 0 ? renderHistory() : 'No history yet'}</p>
    </div>
  );
};

// export default HistoryTracker;
export { HistoryTracker};