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
       <header className="fixed top-0 left-0 w-full z-10 bg-white shadow-sm">
         <Header />
       </header>

       <div className="flex">
         <div className="fixed top-16 left-0 bottom-0 z-10 bg-white shadow-md">
           <Sidebar
             activeSection={activeSection}
             isCollapsed={isSidebarCollapsed}
             toggleSidebar={toggleSidebar}
           />
         </div>

         <main className={`mt-16 ml-${isSidebarCollapsed ? '16' : '64'} flex-1 p-4 transition-all duration-300`}>
           <Routes>
             <Route
               path="/"
               element={
                 <Dashboard
                   activeSection={activeSection}
                   setActiveSection={setActiveSection}
                 />
               }
             />
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