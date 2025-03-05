import { Settings, X, Info} from "lucide-react";
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextProvider";

export function Columns({ id, columnName,dataType, toggleModal }) {

  const { columnSettings, setColumnSettings, complexCheck } = useStateContext("")

  useEffect(() => {
    setColumnSettings((prev) => {
      const defaultSettings = {
        output: "Yes",
        alias: "",
        order: "",
        sort: "",
        aggregate: "",
        groupBy: "No",
        wildcard: "",
        filterBy: "",
      };

      return {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [columnName]: prev[id]?.[columnName] || defaultSettings, 
        },
      };
    });
  }, [id, columnName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setColumnSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [columnName]: {
          ...prev[id][columnName],
          [name]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    console.log("Saving settings for column:", columnSettings[id][columnName]);
    console.log("whole column setting is =====>", columnSettings);
    toggleModal(false);
  };

  return (
    <div className="w-full h-full bg-white border-solid border-l-2">
      <div className="h-[10%] border-solid border-b-2">
        <div className="flex items-center justify-between px-3 h-full">
          <div className="flex items-center">
            <Settings className="w-7 h-7 text-[#8E77BB] pr-3" />
            <span className="text-lg font-medium">Column Settings</span>
          </div>
          <div className="mt-1">
          <button className="text-gray-500 hover:text-gray-700">
            <Info className="h-4" />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <X className="h-4" onClick={() => toggleModal(false)} />
          </button>
          </div>
        </div>
      </div>

      {columnSettings[id] && columnSettings[id][columnName] && (
        <div className="h-[80%] flex justify-center p-3">
          <div className="flex flex-col justify-around space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={columnName}
                className="w-full px-3 py-2 border rounded-lg text-[rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-purple-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <input
                type="text"
                value={dataType}
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
                  value={columnSettings[id][columnName].alias || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Output</label>
                <select
                  name="output"
                  value={columnSettings[id][columnName].output || "Yes"}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {!complexCheck && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  name="order"
                  value={columnSettings[id][columnName].order || 1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sort</label>
                <select
                  name="sort"
                  value={columnSettings[id][columnName].sort || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="">None</option>
                  <option value="Ascending">Ascending</option>
                  <option value="Descending">Descending</option>
                </select>
              </div>
            </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Aggregate</label>
                <select
                  name="aggregate"
                  value={columnSettings[id][columnName].aggregate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="">None</option>
                  <option value="Sum">Sum</option>
                  <option value="Min">Min</option>
                  <option value="Max">Max</option>
                  <option value="Count">Count</option>
                </select>
              </div>
              {!complexCheck && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Group by</label>
                <select
                  name="groupBy"
                  value={columnSettings[id][columnName].groupBy || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              )}
            </div>

            {/* <div>
              <label className="block text-sm text-gray-600 mb-1">Wildcard</label>
              <input
                type="text"
                name="wildcard"
                value={columnSettings[id][columnName].wildcard || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div> */}
          </div>
        </div>
      )}

      <div className="flex border-solid border-t-2 justify-center items-center h-[10%]">
        <div className="flex w-full justify-around">
          <button
            className="w-[43%] px-3 py-1 border rounded-lg hover:bg-gray-50"
            onClick={() => toggleModal(false)}
          >
            Cancel
          </button>
          <button
            className="w-[43%] py-1 px-3 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
            onClick={handleSave}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}