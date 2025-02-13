import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useStateContext } from "../../../../context/contextProvider";

const ColumnSettings = ({
  columnSetting,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const defaultSetting = {
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
  };
  const [settings, setSettings] = useState(defaultSetting);

  const {
    settingsList,
    setSettingsList,
    userSelections,
    setUserSelections,
  } = useStateContext();
  const toggleDialog = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    console.log("columnSetting ==>> ", columnSetting);
    if ((columnSetting?.viewType === "Source") && (columnSetting?.column?.column_name)) {
      // Gettings Old Column Data from Context to update the Column Settings Fields.
        const previousColumnSetting = settingsList.find(
          (item) => item.name === columnSetting.column.column_name
        );
        if (previousColumnSetting) {
          console.log("previousColumnSetting ==> ", previousColumnSetting);
          setSettings(previousColumnSetting);
        } else {
          setSettings({
            ...defaultSetting,
            name: columnSetting?.column.column_name,
            type: columnSetting?.column.data_type
          });
        }
    }

    if ((columnSetting?.viewType === "Connection") && (columnSetting?.column?.column)) {
        const previousColumnSetting = settingsList.find(
          (item) => item.name === columnSetting.column.column
        );
        if (previousColumnSetting) {
          console.log("previousColumnSetting ==> ", previousColumnSetting);
          setSettings(previousColumnSetting);
        } else {
          setSettings({
            ...defaultSetting,
            name: columnSetting?.column.column,
            type: columnSetting?.column.datatype
          });
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
      if (userSelections.get("viewName") !== columnSetting.viewName) {
        setUserSelections((prev) => {
          const updatedUserSelections = new Map(prev);
          updatedUserSelections.clear();
          updatedUserSelections.set("viewName", columnSetting.viewName);

          return updatedUserSelections;
        });
        setSettingsList([settings]); // Clear and Update context.
      } else {
        let index = settingsList.findIndex(
          (item) => item.name === columnSetting.column.column_name
        );
        if (index !== -1) {
          setSettingsList((prev) => {
            const updatedList = [...prev];
            updatedList.splice(index, 1);

            return [...updatedList, settings];
          });
        } else {
          setSettingsList((prev) => [...prev, settings]);
        }
      }
    }

    if (columnSetting.viewType === "Connection") {
      if (
        userSelections.get("connection") !== columnSetting.connection ||
        userSelections.get("schema") !== columnSetting.schema ||
        userSelections.get("table") !== columnSetting.table
      ) {
        setUserSelections((prev) => {
          const updatedUserSelections = new Map(prev);
          updatedUserSelections.clear();

          updatedUserSelections.set("connection", columnSetting.connection);
          updatedUserSelections.set("schema", columnSetting.schema);
          updatedUserSelections.set("table", columnSetting.table);

          return updatedUserSelections;
        });

        setSettingsList([settings]);
      } else {
        let index = settingsList.findIndex(
          (item) => item.name === columnSetting.column.column
        );
        console.log("INDEX ===> ", index);
        if (index !== -1) {
          setSettingsList((prev) => {
            const updatedList = [...prev];
            updatedList.splice(index, 1);

            return [...updatedList, settings];
          });
        } else {
          setSettingsList((prev) => [...prev, settings]);
        }
      }
    }

    setSettings(defaultSetting);

    toggleDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-0 p-0 h-screen">
    <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden h-full">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-medium">Column Settings</span>
          <button
            onClick={toggleDialog}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pl-1">
          {/* Settings Form */}
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
                value={settings.order}
                onChange={handleChange}
                min={1}
                onWheel={(e) => e.target.blur()}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
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
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Aggregate
              </label>
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
              <label className="block text-sm text-gray-600 mb-1">
                Group by
              </label>
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
                <Icon
                  icon="mdi:plus"
                  width={16}
                  height={16}
                  className="text-gray-500"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t">
          <button
            onClick={toggleDialog}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
            onClick={handleExecute}
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default ColumnSettings;
