import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { MigrationSidebar } from "./pages/platform/migration/MigrationSidebar";
import Dashboard from "./pages/Dashboard";
import { PlatformRoutes } from "./routes/PlatformRoutes";
import { DataGovernanceRoutes } from "./routes/DataGovernanceRoutes";
import MigrationCanvas from "./pages/platform/migration/MigrationCanvas";
import { WelcomeModal } from "./pages/platform/migration/WelcomeModal";
import { DrawerProvider } from "./pages/platform/migration/context/DrawerContext";
import { ThemeProvider } from "./pages/platform/migration/context/ThemeContext";
import { TableProvider } from "./pages/platform/migration/context/TableContext";

function App() {

 const [activeSection, setActiveSection] = useState('platform');
 const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


 const toggleSidebar = () => {
   setIsSidebarCollapsed(!isSidebarCollapsed);
 };


  return (
    <Router>
      <Routes>
        {/* Main layout with header/sidebar */}
        <Route
          path="/*"
          element={
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
          }
        />

        {/* Standalone drag-and-drop route outside main layout */}
        <Route
          path="/Migrationcanvas"
          element={
            <TableProvider>
            <ThemeProvider>
              <DrawerProvider>
               
                  <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                    <Header className="h-16 flex-shrink-0" />{" "}
                    <div className="flex-1 flex">
                      <MigrationSidebar className="w-64 flex-shrink-0" />{" "}
                      <div className="flex-1 relative">
                        {" "}
                        <ReactFlowProvider>
                          <MigrationCanvas />
                        </ReactFlowProvider>
                      </div>
                    </div>
                    <WelcomeModal />
                  </div>
                  
              </DrawerProvider>
            </ThemeProvider>
            </TableProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
