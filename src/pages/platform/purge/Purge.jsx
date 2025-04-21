import PurgeEmpty from "./PurgeEmpty";
import PurgeList from "./PurgeList";
const Purge = () => {

  const isLoggedIn = true;

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