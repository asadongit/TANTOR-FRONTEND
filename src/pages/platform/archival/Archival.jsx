import ArchivalList from './ArchivalList';
import ArchivalEmpty from './ArchivalEmpty';

const Archival = () => {

  const isLoggedIn = true

  
  return (
      <div>
        {isLoggedIn ? (
          <ArchivalList/>
        ) : (
          <>
            <ArchivalEmpty/>
          </>
        )}
      </div>
  );
};

export default Archival;