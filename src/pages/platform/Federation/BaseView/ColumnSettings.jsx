import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Info, Settings, Plus, Trash2 } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";

export const defaultSetting = {
  name: "",
  type: "",
  originalOutput: "No",
  alias: "",
  originalAlias: "",
  originalDistinct: "No",
  order: "",
  sort: "",
  aggregate: "",
  groupBy: "No",
  originalSort: "",
  originalOrder: "",
  aggregateDistinct: "No",
};

const ColumnSettings = ({ columnSetting, queryType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [settings, setSettings] = useState([]);

  const {
    settingsList,
    setSettingsList,
    userSelections,
    setUserSelections,
    userCheckedColumns,
    setUserCheckedColumns,
  } = useStateContext();

  const toggleDialog = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    let columnName = "";
    let dataType = "";

    if (columnSetting?.viewType === "Source" && columnSetting?.column?.column_name) {
      columnName = columnSetting.column.column_name;
      dataType = columnSetting.column.data_type;
    } else if (columnSetting?.viewType === "Connection" && columnSetting?.column?.column) {
      columnName = columnSetting.column.column;
      dataType = columnSetting.column.datatype;
    }

    if (columnName) {
      const previousColumnSettings = settingsList.filter(
        (item) => item.name === columnName
      );
      if (previousColumnSettings.length > 0) {
        setSettings(previousColumnSettings);
      } else {
        setSettings([{
          ...defaultSetting,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          name: columnName,
          type: dataType,
        }]);
      }
    }

    if (columnSetting && !isOpen) toggleDialog();
  }, [columnSetting]);

  if (!isOpen) return null;

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => {
      const newSettings = [...prevSettings];
      let updates = {
        ...newSettings[index],
        [name]: value,
      };

      if (name === "sort" && value && (!newSettings[index].order || Number(newSettings[index].order) < 1)) {
        updates.order = 1;
      }

      if (name === "order") {
        const num = Number(value);
        updates.order = num < 1 ? 1 : num;
      }

      newSettings[index] = updates;
      return newSettings;
    });
  };

  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => {
      let finalValue = value;
      if (name === "originalOrder") {
        const num = Number(value);
        finalValue = num < 1 ? 1 : num;
      }
      const updatedSettings = prevSettings.map((config) => ({ ...config, [name]: finalValue }));
      if (name === "originalSort" && finalValue && (!updatedSettings[0].originalOrder || Number(updatedSettings[0].originalOrder) < 1)) {
        return updatedSettings.map((config) => ({ ...config, originalOrder: 1 }));
      }
      return updatedSettings;
    });
  };

  const addConfiguration = () => {
    setSettings((prev) => {
      const isFirstEmpty = prev.length === 1 && !prev[0].aggregate && !prev[0].alias && !prev[0].sort && !prev[0].order && (!prev[0].aggregateDistinct || prev[0].aggregateDistinct === "No") && !prev[0].showOutputConfig;
      
      if (isFirstEmpty) {
        const updated = [...prev];
        updated[0] = { ...updated[0], showOutputConfig: true };
        return updated;
      }
      return [
        ...prev,
        {
          ...defaultSetting,
          showOutputConfig: true,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          name: prev[0].name,
          type: prev[0].type,
        }
      ];
    });
  };

  const removeConfiguration = (index) => {
    setSettings((prev) => {
      const currentArray = [...prev];
      if (index === 0) {
        currentArray[0] = { ...currentArray[0], aggregate: "", alias: "", sort: "", order: "", aggregateDistinct: "No", showOutputConfig: false };
      } else {
        currentArray.splice(index, 1);
      }
      return currentArray;
    });
  };

  const handleReset = () => {
    const defaultConf = {
      ...defaultSetting,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: settings[0]?.name,
      type: settings[0]?.type,
    };
    setSettings([defaultConf]);
  };

  const handleExecute = async (event) => {
    event.preventDefault();

    const isAnyOutput = settings[0]?.originalOutput === "Yes" || settings.some(s => s.aggregate || s.alias);
    const columnName = settings[0]?.name;

    if (isAnyOutput) {
      setUserCheckedColumns((prev) => {
        if (!prev.includes(columnName)) return [...prev, columnName];
        return prev;
      });
    } else {
      setUserCheckedColumns(prev => prev.filter(column => column !== columnName));
    }

    if (columnSetting.viewType === "Source" || columnSetting.viewType === "Connection") {
      let selectionsChanged = false;
      if (columnSetting.viewType === "Source") {
        selectionsChanged = userSelections.get("viewName") !== columnSetting.viewName;
      } else {
        selectionsChanged = userSelections.get("connection") !== columnSetting.connection ||
          userSelections.get("schema") !== columnSetting.schema ||
          userSelections.get("table") !== columnSetting.table;
      }

      if (selectionsChanged) {
        setUserSelections((prev) => {
          const updatedUserSelections = new Map(prev);
          updatedUserSelections.clear();
          if (columnSetting.viewType === "Source") {
            updatedUserSelections.set("viewName", columnSetting.viewName);
          } else {
            updatedUserSelections.set("connection", columnSetting.connection);
            updatedUserSelections.set("schema", columnSetting.schema);
            updatedUserSelections.set("table", columnSetting.table);
          }
          return updatedUserSelections;
        });
        setSettingsList([...settings]);
      } else {
        setSettingsList((prev) => {
          const updatedList = prev.filter(item => item.name !== columnName);
          return [...updatedList, ...settings];
        });
      }
    }

    setSettings([]);
    toggleDialog();
  };

  const renderFormFields = (config, index) => {
    const isEmptyDefault = index === 0 && !config.aggregate && !config.alias && !config.order && !config.sort && (!config.aggregateDistinct || config.aggregateDistinct === "No") && !config.showOutputConfig;
    if (isEmptyDefault) return null;

    const selectedAggs = settings.filter((s, i) => i !== index && s.aggregate).map(s => s.aggregate);

    return (
      <div key={config.id} className="space-y-4 mb-4 relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => removeConfiguration(index)}
          className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
          title="Remove Configuration"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            Output Configuration {index + 1}
          </span>
        </div>

        {queryType === "Regular" ? (
          <>
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
                  {!selectedAggs.includes("Sum") && <option value="Sum">Sum</option>}
                  {!selectedAggs.includes("Min") && <option value="Min">Min</option>}
                  {!selectedAggs.includes("Max") && <option value="Max">Max</option>}
                  {!selectedAggs.includes("Count") && <option value="Count">Count</option>}
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
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
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
          </>
        ) : (
          <>
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
                  {!selectedAggs.includes("Sum") && <option value="Sum">Sum</option>}
                  {!selectedAggs.includes("Min") && <option value="Min">Min</option>}
                  {!selectedAggs.includes("Max") && <option value="Max">Max</option>}
                  {!selectedAggs.includes("Count") && <option value="Count">Count</option>}
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
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-0 p-0 h-screen">
      <div className="w-[450px] bg-white rounded-lg shadow-lg overflow-hidden h-full">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <div className="flex items-center">
              <Settings size={19} className="text-[#8E77BB]" />
              <span className="text-lg font-medium ml-2">Column Settings</span>
            </div>
            <div className="flex items-center">
              <button
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                <Info size={16} />
              </button>
              <button
                onClick={toggleDialog}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pl-1 custom-scrollbar">
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
                      value={settings[0]?.name || ""}
                      className="w-full px-3 py-2 border rounded-lg text-gray-500 bg-gray-100 focus:outline-none text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Type</label>
                    <input
                      type="text"
                      value={settings[0]?.type || ""}
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
                      value={settings[0]?.originalAlias || ""}
                      onChange={handleTopLevelChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Output</label>
                    <select
                      name="originalOutput"
                      value={settings[0]?.originalOutput || "No"}
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
                      value={settings[0]?.groupBy || "No"}
                      onChange={handleTopLevelChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {queryType !== "Complex" && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Sort</label>
                        <select
                          name="originalSort"
                          value={settings[0]?.originalSort || ""}
                          onChange={handleTopLevelChange}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8E77BB] text-sm bg-white"
                        >
                          <option value="">None</option>
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Order</label>
                        <input
                          type="number"
                          name="originalOrder"
                          value={settings[0]?.originalOrder || ""}
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

            {settings.map((config, index) => renderFormFields(config, index))}

            {(() => {
              const validSettings = settings.filter((c, i) => i > 0 || c.aggregate || c.alias || c.order || c.sort || c.aggregateDistinct === "Yes" || c.showOutputConfig);
              const hasEmptyAggregate = validSettings.some((config) => !config.aggregate || !config.alias?.trim());
              const isMaxConfigs = validSettings.length >= 5;
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

          <div className="flex gap-3 mt-4 pt-4 border-t bg-white">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
            >
              Reset
            </button>
            {(() => {
              const validSettings = settings.filter((c, i) => i > 0 || c.aggregate || c.alias || c.order || c.sort || c.aggregateDistinct === "Yes" || c.showOutputConfig);
              const isSaveDisabled = validSettings.some((c) => !c.aggregate || !c.alias?.trim());
              return (
                <button
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isSaveDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#8E77BB] text-white hover:bg-[#7a64a3]"
                    }`}
                  onClick={handleExecute}
                  disabled={isSaveDisabled}
                  title={isSaveDisabled ? "Please provide an aggregate and alias for all configurations" : ""}
                >
                  {queryType === "Complex" ? "Save" : "Execute"}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {showInfo && (
        <div
          className="absolute top-16 right-[466px] bg-white px-4 py-5 w-72 shadow-2xl mb-4 rounded-2xl border border-gray-200 mx-auto animate-fade-in z-50"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div className="space-y-4 text-gray-700 text-xs">
            {[
              { label: "Name", text: "Displays the selected column name." },
              { label: "Type", text: "Displays the selected column type." },
              { label: "Alias", text: "Allows you to specify the column alias." },
              { label: "Output", text: "Choose whether to include the column in the query." },
              { label: "Sort", text: "Specifies the sort order of column values." },
              { label: "Order", text: "Specifies the order in which columns are sorted." },
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
    </div>
  );
};

export default ColumnSettings;