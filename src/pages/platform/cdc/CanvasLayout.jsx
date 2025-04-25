import { useParams } from "react-router-dom";
import { DrawerProvider } from "./context/DrawerContext";
import { ModalProvider } from "./context/ModalProvider";
import { ReactFlowProvider } from "reactflow";
import Header from "../../../components/Header";
import CDCDrawer from "./drawers/CDCDrawer";
import { CDCSidebar } from "./CDCSidebar";
import { WorkflowProvider } from "./context/WorkflowContext";
import CDCCanvas from "./CDCCanvas";

export function CanvasLayout() {
  const { canvasTypeParam } = useParams();

  const canvasTypeMap = {
    migrationcanvas: "migration",
    purgecanvas: "Purge",
    cdccanvas: "cdc",
    metadatacanvas: "migration"
  };
    
  const canvasType = canvasTypeMap[canvasTypeParam?.toLowerCase()];
  return (
    <ReactFlowProvider>
      <WorkflowProvider>
        <DrawerProvider>
        <ModalProvider>
          <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
            <Header className="h-16 flex-shrink-0" />
            <div className="flex-1 relative">
              <CDCSidebar initialCanvasType={canvasType} className="z-10" />
              <div className="w-full h-full">
                <CDCCanvas />
              </div>
            </div>
          </div>
          <CDCDrawer />
          </ModalProvider>
        </DrawerProvider>
      </WorkflowProvider>
    </ReactFlowProvider>
  );
}

export default CanvasLayout;
