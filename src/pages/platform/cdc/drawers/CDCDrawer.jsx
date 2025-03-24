
import { useEffect, useState } from "react";
import { useDrawerContext } from "../context/DrawerContext";
import { Drawer, Divider, Checkbox, FormControlLabel } from "@mui/material";
import { useWorkflow } from "../context/WorkflowContext";

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
    console.log("drawerStates----------------",drawerStates)
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
                {canvasType === "migration" && localTable && (
                  <MigrationDrawerContent
                    localTable={localTable}
                    selectedName={selectedName}
                    setSelectedName={setSelectedName}
                    handleSave={() => handleSave(canvasType)}
                  />
                )}

                {canvasType === "cdc" && drawerState.drawerType === "editTable" && (
                  <CDCDrawerTableContent
                    localTable={localTable}
                    selectedName={selectedName}
                    setSelectedName={setSelectedName}
                    selectedFilter={selectedFilter}
                    setSelectedFilter={setSelectedFilter}
                    value={value}
                    setValue={setValue}
                    parameterEnabled={parameterEnabled}
                    setParameterEnabled={setParameterEnabled}
                    handleSave={() => handleSave(canvasType)}
                  />
                )}
                  {canvasType === "cdc" && drawerState.drawerType === "addtable" && (
                  <AddTable
                    data={data}
                  />
                )}
                {canvasType === "cdc" && drawerState.drawerType === "scope" && (
                  <CDCDrawerScopeContent
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

// -----------------------------------------
const MigrationDrawerContent = ({
  localTable,
  selectedName,
  setSelectedName,
  handleSave,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Migration Field
        </label>
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm"
        >
          <option value="">Select Field</option>
          {localTable?.column_json?.map((column, index) => (
            <option key={index} value={column.column_name}>
              {column.column_name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        Save Migration Settings
      </button>
    </div>
  );
};

// --------------------------------
const CDCDrawerTableContent = ({
  localTable,
  selectedName,
  setSelectedName,
  selectedFilter,
  setSelectedFilter,
  value,
  setValue,
  parameterEnabled,
  setParameterEnabled,
  handleSave,
}) => {

  const { updatePipelineData, pipelines} = useWorkflow();
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-gray-500 text-sm">Table name</label>
          <div className="font-medium">{localTable?.table_name || "ABCD"}</div>
        </div>
        
        <div className="space-y-1">
          <label className="text-gray-500 text-sm">Column Name</label>
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm"
          >
            <option value="">Select</option>
            {localTable?.column_json?.map((column, index) => (
              <option key={index} value={column.column_name}>
                {column.column_name}
              </option>
            )) || []}
          </select>
        </div>
        
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={parameterEnabled}
                onChange={() => setParameterEnabled(!parameterEnabled)}
              />
            }
            label="Select all"
          />
          
          <div className="space-y-1">
            {(localTable?.column_json || [
              { column_name: "ABCD" },
              { column_name: "ABCD" },
              { column_name: "ABCD" },
              { column_name: "ABCD" }
            ]).map((column, index) => (
              <div key={index} className="flex items-center">
                <Checkbox
                  checked={index === 1 || index === 3}
                  
                  color="secondary"
                  size="small"
                />
                <span>{column.column_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// --------------------------------SCOPE-------------------------------------------------------------------------------------------
export const CDCDrawerScopeContent = ({
  drawerState,
  handleSave
}) => {
    const { updatePipelineData, pipelines} = useWorkflow();
  
  const { closeDrawer } = useDrawerContext();
  console.log("kar check-------",drawerState)
  const activePipelineID = drawerState?.pipelineId;

  const sourceData = pipelines[activePipelineID]?.data?.source || {};

  const pipelineOperations = sourceData.op_types || {
    create: false,
    update: false,
    delete: false,
    schemaChanges: false, 
    datafederation: false
  };

  const optionMapping = {
    "Insert": "create",
    "Update": "update",
    "Delete": "delete",
    "Schema changes": "schemaChanges",
    "Data federation view": "datafederation"
  };

  const handleCheckboxChange = (option) => {
    const operationKey = optionMapping[option];
  
    const currentOpTypes = pipelines[activePipelineID]?.data?.source?.op_types ||{
      create: false,
      update: false,
      delete: false,
      schemaChanges: false, 
      datafederation: false
    };
  
    const updatedOpTypes = {
      ...currentOpTypes,
      [operationKey]: !currentOpTypes[operationKey], 
    };
  console.log("updatedOpTypes------",updatedOpTypes)
    updatePipelineData(activePipelineID, "source", { op_types: updatedOpTypes });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {Object.keys(optionMapping).map((option, index) => (
          <div key={index} className="flex items-center">
            <Checkbox
              checked={pipelineOperations[optionMapping[option]] || false}
              onChange={() => handleCheckboxChange(option)}
              color="primary"
              className="text-[#6753a8]"
              sx={{
                color: "#6753a8",
                '&.Mui-checked': {
                  color: "#6753a8",
                },
              }}
            />
            <span className="text-gray-800 ml-2">{option}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="bg-[#6753a8] text-white px-6 py-2 rounded-md hover:bg-[#5a4691] transition-colors"
          onClick={() => {
            handleSave();
            closeDrawer("cdc");
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};


// ---------------------------------ADD TABLE --------------------------------------------------------------


export const AddTable = ({ data, onCreateTable }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [affixType, setAffixType] = useState('prefix'); 
  const [affixValue, setAffixValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); 

  const baseTableName = data || '';


  const getTableName = () => {
    if (affixType === 'prefix') {
      return `${affixValue}${baseTableName}`;
    } else {
      return `${baseTableName}${affixValue}`;
    }
  };

  const handleCreateTable = async () => {
    setIsLoading(true);
    setStatus(null);
    
    try {
      await onCreateTable({ 
        tableName: getTableName(),
        affixType,
        affixValue,
        baseTableName
      });
      setStatus('success');
    } catch (error) {
      console.error('Error creating table:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      
      <div className="space-y-4">

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Original Table Name</label>
          <div className="mt-1 p-2 bg-gray-100 rounded-md border border-gray-300">
            <p className="text-gray-800 font-mono">{baseTableName}</p>
          </div>
        </div> */}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            >
              <span className="block truncate">{affixType === 'prefix' ? 'Prefix' : 'Suffix'}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
            
            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1">
                <button
                  onClick={() => {
                    setAffixType('prefix');
                    setAffixValue("")
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${affixType === 'prefix' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Prefix
                </button>
                <button
                  onClick={() => {
                    setAffixType('suffix');
                    setAffixValue("")
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${affixType === 'suffix' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Suffix
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {affixType === 'prefix' ? 'Prefix Value' : 'Suffix Value'}
          </label>
          <input
            type="text"
            value={affixValue}
            onChange={(e) => setAffixValue(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#8e78b7] focus:border-[#8e78b7]"
            placeholder={affixType === 'prefix' ? "Enter prefix..." : "Enter suffix..."}
          />
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Table Name:</label>
          <p className="text-sm font-mono font-medium">{getTableName()}</p>
        </div>
        
        <div className="mt-5">
          <button
            onClick={handleCreateTable}
            disabled={isLoading  || !baseTableName}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8e78b7] hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8e78b7] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Table...
              </>
            ) : "Create Table"}
          </button>
          
          {status && (
            <div className={`mt-2 text-center text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status === 'success' ? 'Table created successfully!' : 'Error creating table. Please try again.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
