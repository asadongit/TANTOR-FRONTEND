import { useEffect, useState } from "react";
import { Drawer, Divider, Checkbox } from "@mui/material";
import { useWorkflow } from "../../context/WorkflowContext";
import { useDrawerContext } from "../../context/DrawerContext";

const AddScope = ({
    drawerState,
    handleSave
  }) => {
      const { updatePipelineData, pipelines} = useWorkflow();
    
    const { closeDrawer } = useDrawerContext();
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
            className="bg-[#8d77ba] text-white px-6 py-2 rounded-md hover:bg-gray-400  transition-colors"
            onClick={() => {
              handleSave()
              closeDrawer("cdc");
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  };
  

  export default AddScope;