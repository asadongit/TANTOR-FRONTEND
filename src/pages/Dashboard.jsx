import PlatformDashboard from './platform/Dashboard';
import DataGovernanceDashboard from './datagovernance/Dashboard';
import AIDashboard from './AI/dashboard';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Dashboard = ({ activeSection, setActiveSection }) => {
  const tabs = ['Platform', 'Data Governance', 'AI'];
  const navigate = useNavigate();

  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection && ['platform', 'datagovernance', 'ai'].includes(savedSection)) {
      setActiveSection(savedSection);
    }
  }, [setActiveSection]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="my-4">
        <h1 className="text-2xl font-semibold mb-1">👋 Welcome User!</h1>
        <p className="text-gray-600">Dashboard overview</p>
      </div>

      <div className="flex gap-2 mb-6 items-center justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const normalizedTab = tab.toLowerCase().replace(' ', '');
            const isActive = normalizedTab === activeSection;

            return (
              <button
                key={tab}
                onClick={() => handleSectionChange(normalizedTab)}
                className={`px-4 py-2 rounded-full text-sm transition-colors duration-200
                  ${isActive
                    ? 'bg-white text-[#8e78b7] ring-1 ring-[#8e78b7]'
                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            );
          })}
        </div>
        {/* <button type="button" onClick={() => navigate('/dataview')} className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]">
          Data View
        </button> */}
      </div>

      {activeSection === 'platform' ? (
        <PlatformDashboard />
      ) : activeSection === 'datagovernance' ? (
        <DataGovernanceDashboard />
      ) : activeSection === 'ai' ? (
        <AIDashboard />
      ) : null}
    </div>
  );
};

export default Dashboard;