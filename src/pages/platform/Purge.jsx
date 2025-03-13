import PurgeEmpty from "./purge/PurgeEmpty";
import PurgeList from "./purge/PurgeList";

const Purge = () => {

  const isLoggedIn = false;

  return (
    <div>
      {isLoggedIn ?
        (
          <PurgeList />
        )
        :
        (
          <PurgeEmpty />
        )}
    </div>
  );
};

export default Purge;