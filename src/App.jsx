import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import { PlatformRoutes } from "./routes/PlatformRoutes";
import { DataGovernanceRoutes } from "./routes/DataGovernanceRoutes";
import ArchivalCanvas from "./pages/platform/archival/ArchivalCanvas";
import TransformationCanvas from "./pages/platform/archival/ArchivalCanvas";
import { WelcomeModal } from "./pages/platform/react-flow/WelcomeModal";
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
import { Toaster } from "react-hot-toast";
import Chatbot from "./pages/chatbot/Chatbot";
import {
  AuthProvider,
  ProtectedRoute,
  PublicRoute,
} from "./context/AuthContext";
import TantorLogin from "./pages/login";

function App() {
  const [activeSection, setActiveSection] = useState("platform");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <AuthProvider>
        <ContextViewProvider>
          <Toaster />
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <TantorLogin />
                </PublicRoute>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/*"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <Chatbot />
                    <div className="flex">
                      <Sidebar
                        activeSection={activeSection}
                        isCollapsed={isSidebarCollapsed}
                        toggleSidebar={toggleSidebar}
                      />
                      <main
                        className={`flex-1 p-4 transition-all duration-300 overflow-hidden ${
                          isSidebarCollapsed ? "ml-16" : "ml-64"
                        }`}
                      >
                        <Routes>
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
                        </Routes>
                      </main>
                    </div>
                  </div>
                }
              />

              {/* Standalone drag-and-drop routes */}
              <Route
                path="/Migrationcanvas"
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
                                  <ArchivalCanvas />
                                </ReactFlowProvider>
                              </div>
                            </div>
                            <WelcomeModal />
                          </div>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              <Route
                path="/Transformationcanvas"
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
                            <WelcomeModal />
                          </div>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              <Route
                path="/PurgeCanvas"
                element={
                  <TableProvider>
                    <FlowDataProvider>
                      <ThemeProvider>
                        <DrawerProvider>
                          <ContextProvider>
                            <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
                              <Header className="h-16 flex-shrink-0" />
                              <div className="flex-1 flex">
                                <div className="flex-1 relative">
                                  <ReactFlowProvider>
                                    <PurgeCanvas />
                                  </ReactFlowProvider>
                                </div>
                              </div>
                              <WelcomeModal />
                            </div>
                          </ContextProvider>
                        </DrawerProvider>
                      </ThemeProvider>
                    </FlowDataProvider>
                  </TableProvider>
                }
              />

              <Route
                path="/canvas/:canvasTypeParam"
                element={<CanvasLayout />}
              />

              <Route
                path="/viewcanvas"
                element={
                  <ViewDrawer>
                    <div className="flex flex-col h-screen bg-gray-50 text-gray-100">
                      <Header className="h-16 flex-shrink-0" />
                      <div className="flex-1 flex mt-8">
                        <BusinessSidebar className="w-64" />
                        <div className="flex-1 relative">
                          <ReactFlowProvider>
                            <ViewCanvas />
                          </ReactFlowProvider>
                        </div>
                      </div>
                      <BusinessFooter />
                    </div>
                  </ViewDrawer>
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
            </Route>
          </Routes>
        </ContextViewProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
