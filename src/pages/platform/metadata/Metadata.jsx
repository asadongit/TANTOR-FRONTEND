import MetadataList from './MetadataList';
import MetadataEmpty from './MetadataEmpty';
import MigrationList from './MetadataList';
import MigrationEmpty from './MetadataEmpty';


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