import "../env-injector";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import { PlatformRoutes } from "./routes/PlatformRoutes";
import { DataGovernanceRoutes } from "./routes/DataGovernanceRoutes";
import RuleCanvas from "./pages/platform/rule-framework/RuleCanvas";
import { DrawerProvider } from "./pages/platform/react-flow/context/DrawerContext";
import { ThemeProvider } from "./pages/platform/react-flow/context/ThemeContext";
import { TableProvider } from "./pages/platform/react-flow/context/TableContext";
import { ViewCanvas } from "./pages/platform/Federation/BusinessView/ViewCanvas";
import { BusinessSidebar } from "./pages/platform/Federation/BusinessView/BusinessSidebar";
import { ViewDrawer } from "./pages/platform/Federation/context/DrawerContext";
import { FlowDataProvider } from "./pages/platform/react-flow/context/FlowDataContext";
import Source from "./pages/platform/Federation/BaseView/Source";
import { BusinessFooter } from "./pages/platform/Federation/BusinessView/BusinessFooter";
import PurgeCanvas from "./pages/platform/purge/PurgeCanvas";
import { ContextViewProvider } from "./pages/platform/Federation/context/contextViewProvider";
import { ContextProvider } from "./pages/platform/react-flow/context/ContextProvider";
import CanvasLayout from "./pages/platform/cdc/CanvasLayout";
import { PurgeContextProvider } from "./pages/platform/react-flow/context/PurgeContext";
import { Toaster } from "react-hot-toast";
import Chatbot from "./pages/chatbot/Chatbot";
import { ModalProvider } from "./pages/platform/cdc/context/ModalProvider";
import {
  AuthProvider,
  ProtectedRoute,
} from "./context/AuthContext";
import { BusinessHeader } from "./pages/platform/Federation/BusinessView/BusinessHeader";
import TransformationCanvas from "./pages/platform/transformation/components/TransformationCanvas";
import { DatabotProvider } from "./pages/datagovernance/Databot/context/DatabotContext";
import MigrationCanvas from "./pages/platform/migration/components/MigrationCanvas";
import { AIRoutes } from "./routes/AiMainRoutes";
import { AIPlaygroundProvider } from "./context/AIPlaygroundContext";

// Derives sidebar section from the current path — used both for
// lazy useState init (correct on first render) and the navigation effect.
const getSectionFromPath = (path) => {
  if (path.startsWith('/ai')) return 'ai';
  if (path.startsWith('/datagovernance')) return 'datagovernance';
  // On /dashboard, respect whatever the user last chose so the sidebar
  // doesn't flicker back to 'platform' when returning to the dashboard.
  return localStorage.getItem('activeSection') || 'platform';
};

// ─── Inner layout — needs useLocation so must be inside <Router> ──────────────
function MainLayout({ isSidebarCollapsed, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const fromMarketplace = location.state?.fromMarketplace || new URLSearchParams(location.search).get('from_marketplace') === 'true';
  const usecaseName = location.state?.usecaseName || new URLSearchParams(location.search).get('usecase_name');

  // Lazy initializer: correct section on FIRST render — no flash/flicker
  const [activeSection, setActiveSection] = useState(
    () => getSectionFromPath(location.pathname)
  );

  // Keep in sync when the user navigates
  useEffect(() => {
    const section = getSectionFromPath(location.pathname);
    setActiveSection(section);
    // Persist so /dashboard can restore the last-used section
    if (location.pathname !== '/dashboard') {
      localStorage.setItem('activeSection', section);
    }
  }, [location.pathname]);

  // AgentMesh manages its own internal scroll — prevent double scroll container
  const isAgentMesh = location.pathname.startsWith('/ai/agent-mesh');

  return (
    <DatabotProvider>
      <AIPlaygroundProvider>
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
          <Header activeSection={activeSection} />
          <Chatbot />
          <div className="flex flex-1 min-h-0">
            <Sidebar
              activeSection={activeSection}
              isCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
            <main
              className={`flex-1 transition-all duration-300 h-full min-h-0 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'
                } ${isAgentMesh ? 'overflow-hidden' : 'overflow-y-auto'
                }`}
            >
              {fromMarketplace && (
                <div style={{
                  padding: '12px 24px',
                  background: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  zIndex: 20,
                  position: 'relative'
                }}>
                  <button
                    onClick={() => navigate('/ai/agent-mesh')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#8b5cf6', // Light Purple
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8b5cf6'}
                  >
                    Marketplace
                  </button>
                  <span style={{ color: '#cbd5e1', fontSize: 11 }}>&gt;</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>
                    {usecaseName || 'Usecase Page'}
                  </span>
                </div>
              )}
              <Routes>
                <Route path="/datagovernance" element={<Navigate to="/" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                    />
                  }
                />
                <Route path="/*" element={<PlatformRoutes />} />
                {DataGovernanceRoutes}
                {AIRoutes}
              </Routes>
            </main>
          </div>
        </div>
      </AIPlaygroundProvider>
    </DatabotProvider>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("platform");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <AuthProvider>
        <Toaster />
        <ModalProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/*"
                element={
                  <DatabotProvider>
                    <AIPlaygroundProvider>
                      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
                        <Header
                          activeSection={activeSection}
                        />
                        <Chatbot />
                        <div className="flex flex-1 min-h-0">
                          <Sidebar
                            activeSection={activeSection}
                            isCollapsed={isSidebarCollapsed}
                            toggleSidebar={toggleSidebar}
                            setIsSidebarCollapsed={setIsSidebarCollapsed}
                          />
                          <main
                            className={`flex-1 transition-all duration-300 overflow-y-auto h-full min-h-0 ${isSidebarCollapsed ? "ml-16" : "ml-64"
                              }`}
                          >
                            <Routes>
                              <Route path="/datagovernance" element={<Navigate to="/" replace />} />
                              <Route
                                path="/dashboard"
                                element={
                                  <Dashboard
                                    activeSection={activeSection}
                                    setActiveSection={setActiveSection}
                                  />
                                }
                              />
                              <Route path="/*" element={<PlatformRoutes />} />
                              {DataGovernanceRoutes}
                              {AIRoutes}
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </AIPlaygroundProvider>
                  </DatabotProvider>
                }
              />

              {/* Migration canvas */}
              <Route
                path="/migrationCanvas"
                element={
                  <TableProvider>
                    <FlowDataProvider>
                      <ThemeProvider>
                        <DrawerProvider>
                          <div className="flex flex-col h-screen text-black-100">
                            <Header className="h-16 flex-shrink-0" />
                            <div className="flex-1 flex">
                              <div className="flex-1 relative">
                                <ReactFlowProvider>
                                  <MigrationCanvas />
                                </ReactFlowProvider>
                              </div>
                            </div>
                          </div>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              {/* Transformation canvas */}
              <Route
                path="/transformation/studio"
                element={
                  <TableProvider>
                    <FlowDataProvider>
                      <ThemeProvider>
                        <DrawerProvider>
                          <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                            <Header className="h-16 flex-shrink-0" />
                            <div className="flex-1 flex">
                              <div className="flex-1 relative">
                                <ReactFlowProvider>
                                  <TransformationCanvas />
                                </ReactFlowProvider>
                              </div>
                            </div>
                          </div>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              {/* using this purge */}
              <Route
                path="/PurgeCanvas"
                element={
                  <TableProvider>
                    <FlowDataProvider>
                      <ThemeProvider>
                        <DrawerProvider>
                          <ContextProvider>
                            <PurgeContextProvider>
                              <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                                <Header className="h-16 flex-shrink-0" />
                                <div className="flex-1 flex">
                                  <div className="flex-1 relative">
                                    <ReactFlowProvider>
                                      <PurgeCanvas />
                                    </ReactFlowProvider>
                                  </div>
                                </div>
                              </div>
                            </PurgeContextProvider>
                          </ContextProvider>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              {/* this is used in cdc canvas */}
              <Route
                path="/canvas/:canvasTypeParam"
                element={<CanvasLayout />}
              />

              {/* federation canvas */}
              <Route
                path="/viewcanvas"
                element={
                  <ContextViewProvider>
                    <ViewDrawer>
                      <div className="flex flex-col h-screen bg-gray-50 text-gray-100">
                        <Header className="h-16 flex-shrink-0" /> {" "}
                        <BusinessHeader />
                        <div className="flex-1 flex mt-8">
                          <BusinessSidebar className="w-64" /> {" "}
                          <div className="flex-1 relative">
                            {" "}
                            <ReactFlowProvider>
                              <ViewCanvas />
                            </ReactFlowProvider>
                          </div>
                        </div>
                        <BusinessFooter />
                      </div>
                    </ViewDrawer>
                  </ContextViewProvider>
                }
              />
              <Route
                path="/federation/view/source"
                element={
                  <ContextViewProvider>
                    <div className="h-screen flex flex-col">
                      <Header className="flex-shrink-0 h-16" />
                      <div className="flex-1 relative overflow-hidden">
                        <ReactFlowProvider>
                          <Source />
                        </ReactFlowProvider>
                      </div>
                    </div>
                  </ContextViewProvider>
                }
              />

              {/* rules canvas */}
              <Route
                path="/config/rule/create-rule"
                element={
                  <ContextViewProvider>
                    <TableProvider>
                      <FlowDataProvider>
                        <ThemeProvider>
                          <DrawerProvider>
                            <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                              <Header className="h-16 flex-shrink-0" />
                              <div className="flex-1 flex">
                                <div className="flex-1 relative">
                                  <ReactFlowProvider>
                                    <RuleCanvas />
                                  </ReactFlowProvider>
                                </div>
                              </div>
                            </div>
                          </DrawerProvider>
                        </ThemeProvider>
                      </FlowDataProvider>
                    </TableProvider>
                  </ContextViewProvider>
                }
              />
              <Route
                path="/config/rule/edit-rule"
                element={
                  <ContextViewProvider>
                    <TableProvider>
                      <FlowDataProvider>
                        <ThemeProvider>
                          <DrawerProvider>
                            <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                              <Header className="h-16 flex-shrink-0" />
                              <div className="flex-1 flex">
                                <div className="flex-1 relative">
                                  <ReactFlowProvider>
                                    <RuleCanvas />
                                  </ReactFlowProvider>
                                </div>
                              </div>
                            </div>
                          </DrawerProvider>
                        </ThemeProvider>
                      </FlowDataProvider>
                    </TableProvider>
                  </ContextViewProvider>
                }
              />
            </Route>

          </Routes>
        </ModalProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;