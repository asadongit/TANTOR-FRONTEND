import MigrationList from './MigrationList';
import MigrationEmpty from './MigrationEmpty';

const Migration = () => {

  const isLoggedIn = true

  
  return (
      <div>
        {isLoggedIn ? (
          <MigrationList/>
        ) : (
          <>
            <MigrationEmpty/>
          </>
        )}
      </div>
  );
};

export default Migration;