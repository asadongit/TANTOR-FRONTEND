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