import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { PlatformRoutes } from './routes/PlatformRoutes';
import { DataGovernanceRoutes } from './routes/DataGovernanceRoutes';

function App() {
  const [activeSection, setActiveSection] = useState('platform');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar
            activeSection={activeSection}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
          <main className={`flex-1 p-4 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <Routes>
              <Route path="/" element={<Dashboard activeSection={activeSection} setActiveSection={setActiveSection} />} />
              {PlatformRoutes}
              {DataGovernanceRoutes}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;