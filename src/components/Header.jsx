import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Tantor.svg';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between">
      <div className="flex items-center">
        <img
          src={Logo}
          alt="Tantor"
          className="h-8 cursor-pointer"
          onClick={() => navigate('/')}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
        <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
          T
        </button>
      </div>
    </header>
  );
};

export default Header;