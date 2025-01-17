import PlatformDashboard from './platform/Dashboard';
import DataGovernanceDashboard from './datagovernance/Dashboard';

const Dashboard = ({ activeSection, setActiveSection }) => {
  const tabs = ['Platform', 'Data Governance', 'AI'];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-1">👋 Welcome User!</h1>
        <p className="text-gray-600">Dashboard overview</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const normalizedTab = tab.toLowerCase().replace(' ', '');
          const isActive = normalizedTab === activeSection;

          return (
            <button
              key={tab}
              onClick={() => setActiveSection(normalizedTab)}
              className={`px-4 py-2 rounded-full text-sm transition-colors duration-200
                ${isActive
                  ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200'
                  : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeSection === 'platform' ? (
        <PlatformDashboard />
      ) : activeSection === 'datagovernance' ? (
        <DataGovernanceDashboard />
      ) : null}
    </div>
  );
};

export default Dashboard;