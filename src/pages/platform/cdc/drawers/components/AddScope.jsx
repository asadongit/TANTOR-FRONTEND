import { useEffect, useState } from "react";
import { Checkbox } from "@mui/material";
import { useWorkflow } from "../../context/WorkflowContext";
import { useDrawerContext } from "../../context/DrawerContext";

const AddScope = ({ drawerState, handleSave }) => {
  const { updatePipelineData, pipelines } = useWorkflow();
  const { closeDrawer } = useDrawerContext();
  const activePipelineID = drawerState?.pipelineId;

  const sourceData = pipelines[activePipelineID]?.data?.source || {};

  const optionMapping = {
    "Insert": "create",
    "Update": "update",
    "Delete": "delete",
    "Schema changes": "schemaChanges",
    "Data federation view": "datafederation"
  };

  const [localOpTypes, setLocalOpTypes] = useState({
    create: true,
    update: false,
    delete: false,
    schemaChanges: false,
    datafederation: false
  });

  useEffect(() => {
    if (sourceData?.op_types) {
      setLocalOpTypes(sourceData.op_types);
    }
  }, [sourceData]);

  const handleCheckboxChange = (option) => {
    const operationKey = optionMapping[option];
    let updatedOpTypes = { ...localOpTypes };

    updatedOpTypes[operationKey] = !updatedOpTypes[operationKey];

    if (operationKey === "create" && updatedOpTypes.create) {
      updatedOpTypes.delete = false;
      updatedOpTypes.update = false; 
    }
    if (operationKey === "update" && updatedOpTypes.update) {
      updatedOpTypes.delete = false;
      updatedOpTypes.create = false;
    }
    if (operationKey === "delete" && updatedOpTypes.delete) {
      updatedOpTypes.update = true; 
      updatedOpTypes.create = false;
    }

    setLocalOpTypes(updatedOpTypes);
    updatePipelineData(activePipelineID, "source", { op_types: updatedOpTypes });
  };

  const isDisabled = (option) => {
    const op = optionMapping[option];
    if (localOpTypes.create) {
      return op === "delete" || op === "update";
    }
    if (localOpTypes.update) {
    }
    if (localOpTypes.delete) {
      return op === "create";
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {Object.keys(optionMapping).map((option, index) => (
          <div key={index} className="flex items-center">
            <Checkbox
              checked={localOpTypes[optionMapping[option]] || false}
              onChange={() => handleCheckboxChange(option)}
              color="primary"
              disabled={isDisabled(option)}
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
          className="bg-[#8d77ba] text-white px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
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

export default AddScope;
