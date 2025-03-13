import TransformationList from './TransformationList';
import TransformationEmpty from './TransformationEmpty';

const Transformation = () => {

  const isLoggedIn = true

  
  return (
      <div>
        {isLoggedIn ? (
          <TransformationList/>
        ) : (
          <>
            <TransformationEmpty/>
          </>
        )}
      </div>
  );
};

export default Transformation;