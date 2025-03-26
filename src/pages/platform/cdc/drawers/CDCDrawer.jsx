
import { useEffect, useState } from "react";
import { useDrawerContext } from "../context/DrawerContext";
import { Drawer, Divider, Checkbox, FormControlLabel } from "@mui/material";
import { useWorkflow } from "../context/WorkflowContext";
import AddTable from "./components/AddTable";
import AddScope from "./components/AddScope";
import EditTable from "./components/EditTable";

const CDCDrawer = ({ nodes, setNodes }) => {
  const { drawerStates, closeDrawer } = useDrawerContext();

  const [canvasType, setCanvasType] = useState(null);
  const [drawerType, setDrawerType] = useState(null);
  const [localTable, setLocalTable] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [value, setValue] = useState("");
  const [parameterEnabled, setParameterEnabled] = useState(false);
  const [operations, setOperations] = useState({
    INSERT: false,
    UPDATE: false,
    DELETE: false,
    "SCHEMA CHANGES": false,
    "DATA FEDERATION VIEW": false,
  });
  const [data,setData]=useState('')
  useEffect(() => {
    const activeDrawer = Object.entries(drawerStates).find(
      ([, state]) => state.isOpen
    )?.[1];

    setCanvasType(activeDrawer?.canvasType || null);
    setDrawerType(activeDrawer?.drawerType || null);
    setData(activeDrawer?.data||null)

  }, [drawerStates]);


  const getDrawerTitle = (type) => {
    switch (type) {
      case "editTable":
        return "Edit";
      case "scope":
        return "Scope";
      case "addtable":
        return "Add Table"
      default:
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
    }
  };

  const handleSave = (canvasType) => {
    const drawerState = drawerStates[canvasType];
    if (!localTable || !drawerState.nodeId) return;

    let updatedNodes = [...nodes];

    if (canvasType === "migration") {
      updatedNodes = nodes.map((node) =>
        node.id === drawerState.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                tables: node.data.tables?.map((t) =>
                  t.table_name === localTable.table_name
                    ? { ...t, migrationField: selectedName } 
                    
                    : t
                ),
              },
            }
          : node
      );
    } else if (canvasType === "cdc") {

      const whereCondition =
        selectedName && selectedFilter && value
          ? `${selectedName} ${selectedFilter} ${value}`
          : "";

      updatedNodes = nodes.map((node) =>
        node.id === drawerState.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                tables: node.data.tables?.map((t) =>
                  t.table_name === localTable.table_name
                    ? { ...t, whereCondition } 
                    
                    : t
                ),
              },
            }
          : node
      );
    }

    setNodes(updatedNodes);
    closeDrawer(canvasType);
  };

  return (
    <>
      {Object.entries(drawerStates)
        .filter(([_, drawerState]) => drawerState.isOpen)
        .map(([canvasType, drawerState]) => (
          <Drawer
            key={drawerState.pipelineID}
            anchor="right"
            open={drawerState.isOpen}
            onClose={() => closeDrawer(canvasType)}
          >
            <div className="w-[400px]">


              <div className="flex items-center gap-2 text-[#6753a8] p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className="text-[#6753a8]"
                >
                  <path
                    fill="currentColor"
                    d="M12 13.5q-.633 0-1.066-.434Q10.5 12.633 10.5 12t.434-1.066Q11.367 10.5 12 10.5t1.066.434q.434.433.434 1.066t-.434 1.066q-.433.434-1.066.434ZM11.5 8V4h1v4h-1Zm0 12v-4h1v4h-1Zm4.5-7.5v-1h4v1h-4Zm-12 0v-1h4v1H4Z"
                  />
                </svg>
                <h2 className="text-xl font-medium">
                  {getDrawerTitle(drawerState.drawerType)}
                </h2>
              </div>
              

              <Divider className="w-full" sx={{ margin: 0 }} />
              
              <div className="p-4">
                           {canvasType === "cdc" && drawerState.drawerType === "editTable" && (
                  <EditTable
                  data={data}
                  />
                )}
                  {canvasType === "cdc" && drawerState.drawerType === "addtable" && (
                  <AddTable
                    data={data}
                  />
                )}
                {canvasType === "cdc" && drawerState.drawerType === "scope" && (
                  <AddScope
                    key={drawerState.pipelineID}
                    drawerState={drawerState}
                    operations={operations}
                    setOperations={setOperations}
                    handleSave={() =>
                      console.log("Final Scope Settings:", operations)
                    }
                  />
                )}
              </div>
            </div>
          </Drawer>
        ))}
    </>
  );
};

export default CDCDrawer;


