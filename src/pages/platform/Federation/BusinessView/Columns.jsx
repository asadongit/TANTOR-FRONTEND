import { Settings, X, Info, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";
import { useLocation } from "react-router-dom";

export const defaultSettings = {
  id: "",
  originalOutput: "No",
  alias: "",
  order: "",
  sort: "",
  aggregate: "",
  groupBy: "No",
  wildcard: "",
  filterBy: "",
  originalSort: "",
  originalOrder: "",
  originalAlias: "",
  originalDistinct: "No",
  aggregateDistinct: "No",
};

export function Columns({ id, columnName, dataType, toggleModal, selectedColumns, setSelectedColumns }) {
  const { columnSettings, setColumnSettings, complexCheck } = useStateContext("");
  const [showInfo, setShowInfo] = useState(false);

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };

  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    let currentConfigs = columnSettings[id]?.[columnName];

    // Migrate old object structure to array if needed
    if (currentConfigs && !Array.isArray(currentConfigs)) {
      currentConfigs = [{ ...currentConfigs, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }];
    }

    if (!currentConfigs || currentConfigs.length === 0) {
      currentConfigs = [{ ...defaultSettings, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }];
    }

    setConfigs(currentConfigs);
  }, [id, columnName]);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setConfigs((prev) => {
      const currentArray = [...prev];
      if (!currentArray[index]) return prev;

      let updates = { [name]: value };

      if (name === "sort" && value && (!currentArray[index].order || Number(currentArray[index].order) < 1)) {
        updates.order = 1;
      }
      if (name === "order") {
        const num = Number(value);
        updates.order = num < 1 ? 1 : num;
      }

      currentArray[index] = { ...currentArray[index], ...updates };
      return currentArray;
    });
  };

  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setConfigs((prev) => {
      const currentArray = [...prev];

      let finalValue = value;
      if (name === "originalOrder") {
        const num = Number(value);
        finalValue = num < 1 ? 1 : num;
      }

      let updatedArray = currentArray.map(config => ({ ...config, [name]: finalValue }));

      if (name === "originalSort" && finalValue && (!updatedArray[0].originalOrder || Number(updatedArray[0].originalOrder) < 1)) {
        updatedArray = updatedArray.map(config => ({ ...config, originalOrder: 1 }));
      }

      return updatedArray;
    });
  };

  const addConfiguration = () => {
    setConfigs((prev) => {
      const currentArray = [...prev];

      const isFirstEmpty = currentArray.length === 1 && !currentArray[0].aggregate && !currentArray[0].alias && !currentArray[0].sort && !currentArray[0].order && (!currentArray[0].aggregateDistinct || currentArray[0].aggregateDistinct === "No") && !currentArray[0].showOutputConfig;

      if (isFirstEmpty) {
        currentArray[0] = { ...currentArray[0], showOutputConfig: true };
      } else {
        currentArray.push({
          ...defaultSettings,
          showOutputConfig: true,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        });
      }

      return currentArray;
    });
  };

  const removeConfiguration = (index) => {
    setConfigs((prev) => {
      const currentArray = [...prev];
      if (index === 0) {
        currentArray[0] = { ...currentArray[0], aggregate: "", alias: "", sort: "", order: "", aggregateDistinct: "No", showOutputConfig: false };
      } else {
        currentArray.splice(index, 1);
      }
      return currentArray;
    });
  };

  const handleSave = () => {
    setColumnSettings((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [columnName]: configs,
      },
    }));

    if (setSelectedColumns) {
      const isAnyOutput = configs[0]?.originalOutput === "Yes" || configs.some(s => s.aggregate || s.alias);
      if (isAnyOutput) {
        setSelectedColumns((prev) => {
          if (!prev.includes(columnName)) return [...prev, columnName];
          return prev;
        });
      } else {
        setSelectedColumns((prev) => prev.filter(c => c !== columnName));
      }
    }
    toggleModal(false);
  };

  const handleReset = () => {
    setConfigs([{ ...defaultSettings, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }]);
  };

  return (
    <>
      <div className="w-full h-full bg-white border-solid border-l-2 flex flex-col">
        <div className="h-[60px] border-solid border-b-2 flex-shrink-0">
          <div className="flex items-center justify-between px-3 h-full">
            <div className="flex items-center">
              <Settings className="w-7 h-7 text-[#8E77BB] pr-3" />
              <span className="text-lg font-medium">Column Settings</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <button
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-gray-500 hover:text-gray-700">
                <Info className="h-4" />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <X className="h-4" onClick={() => toggleModal(false)} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {/* Top Level Original Column Settings */}
          <div className="mb-6 bg-[#8E77BB]/5 p-4 rounded-xl border border-[#8E77BB]/20">
            <div className="mb-4 border-b border-[#8E77BB]/20 pb-3">
              <span className="text-md font-medium text-[#8E77BB]">Original Column Settings</span>
              <p className="text-xs text-gray-500 mt-1">These settings apply directly to the original source column.</p>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={columnName}
                    className="w-full px-3 py-2 border rounded-lg text-gray-500 bg-gray-100 focus:outline-none text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <input
                    type="text"
                    value={dataType}
                    className="w-full px-3 py-2 border rounded-lg text-gray-500 bg-gray-100 focus:outline-none text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Alias</label>
                  <input
                    type="text"
                    name="originalAlias"
                    placeholder="Alias"
                    value={configs[0]?.originalAlias || ""}
                    onChange={handleTopLevelChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Output</label>
                  <select
                    name="originalOutput"
                    value={configs[0]?.originalOutput || "No"}
                    onChange={handleTopLevelChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Group by</label>
                  <select
                    name="groupBy"
                    value={configs[0]?.groupBy || "No"}
                    onChange={handleTopLevelChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {modalState.queryType !== "Complex" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Sort</label>
                      <select
                        name="originalSort"
                        value={configs[0]?.originalSort || ""}
                        onChange={handleTopLevelChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                      >
                        <option value="">None</option>
                        <option value="Ascending">Ascending</option>
                        <option value="Descending">Descending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Order</label>
                      <input
                        type="number"
                        name="originalOrder"
                        value={configs[0]?.originalOrder || ""}
                        placeholder="e.g. 1"
                        onChange={handleTopLevelChange}
                        min={1}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>

                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-2 px-1">
            <span className="text-md font-medium text-gray-800">Output Configurations</span>
            <p className="text-xs text-gray-500 mt-1 mb-3">Define how this column should be aggregated and aliased in the output.</p>
          </div>

          {configs.map((config, index) => {
            const isEmptyDefault = index === 0 && !config.aggregate && !config.alias && !config.order && !config.sort && (!config.aggregateDistinct || config.aggregateDistinct === "No") && !config.showOutputConfig;
            if (isEmptyDefault) return null;

            const selectedAggs = configs.filter((c, i) => i !== index && c.aggregate).map(c => c.aggregate);
            return (
              <div key={config.id || index} className="mb-4 relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => removeConfiguration(index)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove Configuration"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Output Configuration {index + 1}
                  </span>
                </div>

                <div className="flex flex-col space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Aggregate <span className="text-red-500">*</span></label>
                      <select
                        name="aggregate"
                        value={config.aggregate || ""}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                      >
                        <option value="">None</option>
                        {!selectedAggs.includes("Count") && <option value="Count">Count</option>}
                        {!selectedAggs.includes("Sum") && <option value="Sum">Sum</option>}
                        {!selectedAggs.includes("Min") && <option value="Min">Min</option>}
                        {!selectedAggs.includes("Max") && <option value="Max">Max</option>}
                        {!selectedAggs.includes("Avg") && <option value="Avg">Avg</option>}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Alias <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="alias"
                        placeholder="Alias"
                        value={config.alias || ""}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                      />
                    </div>
                  </div>

                  {modalState.queryType !== "Complex" && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Sort</label>
                        <select
                          name="sort"
                          value={config.sort || ""}
                          onChange={(e) => handleChange(index, e)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                        >
                          <option value="">None</option>
                          <option value="Ascending">Ascending</option>
                          <option value="Descending">Descending</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Order</label>
                        <input
                          type="number"
                          name="order"
                          value={config.order || ""}
                          placeholder="e.g. 1"
                          onChange={(e) => handleChange(index, e)}
                          min={1}
                          onWheel={(e) => e.target.blur()}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>

                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Distinct</label>
                      <select
                        name="aggregateDistinct"
                        value={config.aggregateDistinct || "No"}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(() => {
            const validConfigs = configs.filter((c, i) => i > 0 || c.aggregate || c.alias || c.order || c.sort || c.aggregateDistinct === "Yes" || c.showOutputConfig);
            const hasEmptyAggregate = validConfigs.some((config) => !config.aggregate || !config.alias?.trim());
            const isMaxConfigs = validConfigs.length >= 5;
            const isAddDisabled = isMaxConfigs || hasEmptyAggregate;
            let buttonText = "Add Configuration";
            if (isMaxConfigs) buttonText = "All Aggregates Used";
            else if (hasEmptyAggregate) buttonText = "Complete Config First";

            return (
              <button
                onClick={addConfiguration}
                disabled={isAddDisabled}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg transition-colors ${isAddDisabled
                  ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                  : "border-[#8E77BB] text-[#8E77BB] hover:bg-[#8E77BB]/5"
                  }`}
              >
                <Plus size={16} />
                <span>{buttonText}</span>
              </button>
            );
          })()}
        </div>

        <div className="flex border-solid border-t-2 justify-center items-center h-[60px] flex-shrink-0 bg-white">
          <div className="flex w-full justify-around px-3 gap-3">
            <button
              className="flex-1 px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              onClick={handleReset}
            >
              Reset
            </button>
            {(() => {
              const validConfigs = configs.filter((c, i) => i > 0 || c.aggregate || c.alias || c.order || c.sort || c.aggregateDistinct === "Yes" || c.showOutputConfig);
              const isSaveDisabled = validConfigs.some((c) => !c.aggregate || !c.alias?.trim());
              return (
                <button
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-colors ${isSaveDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#8E77BB] text-white hover:bg-[#7a64a3]"
                    }`}
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  title={isSaveDisabled ? "Please provide an aggregate and alias for all configurations" : ""}
                >
                  Save Changes
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {showInfo && (
        <div
          className="fixed top-16 right-[466px] bg-white px-4 py-5 w-72 shadow-2xl rounded-2xl border border-gray-200 animate-fade-in z-50"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div className="space-y-4 text-gray-700 text-xs">
            {[
              { label: "Name", text: "Displays the selected column name." },
              { label: "Type", text: "Displays the selected column type." },
              { label: "Alias", text: "Allows you to specify the column alias." },
              { label: "Output", text: "Choose whether to include the column in the query." },
              { label: "Sort Type", text: "Specifies the sort order of column values." },
              { label: "Sort Order", text: "Specifies the order in which columns are sorted." },
              { label: "Group By", text: "Groups data by column values." },
              { label: "Aggregate", text: "Specifies the aggregate function. You can add multiple configurations for the same column." }
            ].map((item, index) => (
              <div key={index}>
                <p className="text-gray-900 font-medium">{item.label}</p>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>

          <hr className="border-t border-dashed border-gray-300 my-4" />

          <div className="px-3 py-2 bg-[#8E77BB]/10 text-[#8E77BB] rounded-lg text-xs border border-[#8E77BB]/20">
            <strong>Note</strong>
            <p className="mt-1">You can add multiple configurations to compute different aggregates for the same column.</p>
          </div>
        </div>
      )}
    </>
  );
}