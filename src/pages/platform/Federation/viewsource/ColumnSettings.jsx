import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {useStateContext} from "../../../../context/contextProvider";

const ColumnSettings = ({
  columnSetting,
  // settingsPayload,
  // setSettingsPayload,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    type: "",
    output: "Yes",
    alias: "",
    order: "",
    sort: "",
    aggregate: "",
    groupBy: "",
    wildcard: "",
    filterBy: "",
  });
  
  const {settingsPayload,setSettingsPayload} = useStateContext();
  const toggleDialog = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    console.log("columnSetting ==>> ", columnSetting)
    if (columnSetting?.viewType === "Source") {
      if (columnSetting?.column?.column_name) {
        if (settingsPayload.get("viewName") === columnSetting.viewName && settingsPayload.has(columnSetting.column.column_name)) {
          setSettings(settingsPayload.get(columnSetting.column.column_name));
        } else {
          setSettings({
            name: columnSetting?.column.column_name,
            type: columnSetting?.column.data_type,
            output: "Yes",
            alias: "",
            order: "",
            sort: "",
            aggregate: "",
            groupBy: "",
            wildcard: "",
            filterBy: "",
          });
        }
      }
    }

    if (columnSetting?.viewType === "Connection") {
      console.log("columnSetting ==> ", columnSetting);
      if (columnSetting?.column?.column) {
        if (
          settingsPayload.get("connection") === columnSetting.connection &&
          settingsPayload.get("schema") === columnSetting.schema &&
          settingsPayload.get("table") === columnSetting.table &&
          settingsPayload.has(columnSetting.column.column)
        ) {
          setSettings(settingsPayload.get(columnSetting.column.column));
        } else {
          setSettings({
            name: columnSetting?.column.column,
            type: columnSetting?.column.datatype,
            output: "Yes",
            alias: "",
            order: "",
            sort: "",
            aggregate: "",
            groupBy: "",
            wildcard: "",
            filterBy: "",
          });
        }
      }
    }
    if (!isOpen) toggleDialog();
  }, [columnSetting]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleExecute = async (event) => {
    event.preventDefault();

    if (columnSetting.viewType === "Source") {
      setSettingsPayload((prev) => {
        const updatedSettingsPayload = new Map(prev);
        if (settingsPayload.get("viewName") !== columnSetting.viewName) {
          updatedSettingsPayload.clear();
          updatedSettingsPayload.set("viewName", columnSetting.viewName);
        }
        updatedSettingsPayload.set(settings.name, settings);

        return updatedSettingsPayload;
      });

      setSettings({
        name: "",
        type: "",
        output: "Yes",
        alias: "",
        order: "",
        sort: "",
        aggregate: "",
        groupBy: "",
        wildcard: "",
        filterBy: "",
      });
    }
    if (columnSetting.viewType === "Connection") {
      setSettingsPayload((prev) => {
        const updatedSettingsPayload = new Map(prev);
        if (
          settingsPayload.get("connection") !== columnSetting.connection ||
          settingsPayload.get("schema") !== columnSetting.schema ||
          settingsPayload.get("table") !== columnSetting.table
        ) {
          updatedSettingsPayload.clear();
          updatedSettingsPayload.set("connection", columnSetting.connection);
          updatedSettingsPayload.set("schema", columnSetting.schema);
          updatedSettingsPayload.set("table", columnSetting.table);
        }
        updatedSettingsPayload.set(settings.name, settings);

        console.log("\n\n\nColumn setting ==> ", columnSetting);
        console.log("UDATED PAYLOAD ==> ", updatedSettingsPayload);
        return updatedSettingsPayload;
      });
    }
    toggleDialog();
  };

  return (
    <div className="w-full flex justify-end items-start">
      <div className="w-80 bg-white p-4 rounded-lg shadow-lg absolute top-4 right-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-medium">Column Settings</span>
          <button onClick={toggleDialog} className="text-gray-500 hover:text-gray-700">
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={settings.name || ""}
              className="w-full px-3 py-2 border rounded-lg text-[rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-purple-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <input
              type="text"
              value={settings.type || ""}
              className="w-full px-3 py-2 border rounded-lg text-[rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-purple-500"
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Alias</label>
              <input
                type="text"
                name="alias"
                placeholder="Alias"
                value={settings.alias || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Output</label>
              <select
                name="output"
                value={settings.output || "Yes"}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Order</label>
              <input
                type="number"
                name="order"
                value={settings.order || 1}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sort</label>
              <select
                name="sort"
                value={settings.sort || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                <option value="Ascending">Ascending</option>
                <option value="Descending">Descending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Aggregate</label>
              <select
                name="aggregate"
                value={settings.aggregate || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                <option value="Sum">Sum</option>
                <option value="Min">Min</option>
                <option value="Max">Max</option>
                <option value="Count">Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Group by</label>
              <select
                name="groupBy"
                value={settings.groupBy || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Wildcard</label>
            <input
              type="text"
              name="wildcard"
              value={settings.wildcard || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by</label>
            <div className="flex gap-2">
              <select
                name="filterBy"
                value={settings.filterBy}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select a filter</option>
                <option value="filter1">Filter 1</option>
                <option value="filter2">Filter 2</option>
                <option value="filter3">Filter 3</option>
              </select>
              <button className="px-2 py-2 border rounded-lg hover:bg-gray-50">
                <Icon icon="mdi:plus" width={16} height={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={toggleDialog} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]" onClick={handleExecute}>
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSettings;