import { Settings, X, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useStateContext } from "../context/contextViewProvider";
import { useLocation } from "react-router-dom";

export function Columns({ id, columnName, dataType, toggleModal }) {

  const { columnSettings, setColumnSettings, complexCheck } = useStateContext("")

  const modalState = useLocation().state || {
    queryType: "Regular",
    viewType: "Business",
  };


  useEffect(() => {
    setColumnSettings((prev) => {
      const defaultSettings = {
        output: "No",
        alias: "",
        includeAs: "alias",
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
    setColumnSettings((prev) => {
      const current = prev[id]?.[columnName] || {};
      let updates = { [name]: value };

      // When alias is cleared, reset includeAs to default
      if (name === "alias" && !value.trim()) updates.includeAs = "alias";

      // When sort is set and order is empty/0, default order to 1
      if (name === "sort" && value && (!current.order || Number(current.order) < 1)) {
        updates.order = 1;
      }

      // Clamp order to minimum 1
      if (name === "order") {
        const num = Number(value);
        updates.order = num < 1 ? 1 : num;
      }

      return {
        ...prev,
        [id]: {
          ...prev[id],
          [columnName]: {
            ...current,
            ...updates,
          },
        },
      };
    });
  };

  const handleSave = () => {
    toggleModal(false);
  };

  const handleReset = () => {
    setColumnSettings((prev) => {
      const defaultSettings = {
        output: "No",
        alias: "",
        includeAs: "alias",
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
          ...prev[id],
          [columnName]: defaultSettings,
        },
      };
    });
  };
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div className="w-full h-full bg-white border-solid border-l-2">
        <div className="h-[10%] border-solid border-b-2">
          <div className="flex items-center justify-between px-3 h-full">
            <div className="flex items-center">
              <Settings className="w-7 h-7 text-[#8E77BB] pr-3" />
              <span className="text-lg font-medium">Column Settings</span>
            </div>
            <div className="mt-1">
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

              {columnSettings[id][columnName].alias && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Include As</label>
                  <select
                    name="includeAs"
                    value={columnSettings[id][columnName].includeAs || "alias"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                  >
                    <option value="alias">Alias Only ({columnSettings[id][columnName].alias?.length > 20 ? columnSettings[id][columnName].alias.slice(0, 20) + "…" : columnSettings[id][columnName].alias})</option>
                    <option value="original">Original Only ({columnName?.length > 20 ? columnName.slice(0, 20) + "…" : columnName})</option>
                    <option value="both">Both ({columnName?.length > 15 ? columnName.slice(0, 15) + "…" : columnName} + {columnSettings[id][columnName].alias?.length > 15 ? columnSettings[id][columnName].alias.slice(0, 15) + "…" : columnSettings[id][columnName].alias})</option>
                  </select>
                </div>
              )}

              {modalState.queryType != "Complex" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Order</label>
                    <input
                      type="number"
                      name="order"
                      value={columnSettings[id][columnName].order || 1}
                      onChange={handleChange}
                      min={1}
                      onWheel={(e) => e.target.blur()}
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
                    <option value="Count">Count</option>
                    <option value="Sum">Sum</option>
                    <option value="Min">Min</option>
                    <option value="Max">Max</option>
                    <option value="Avg">Avg</option>
                  </select>
                </div>
                {modalState.queryType != "Complex" && (
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
              onClick={handleReset}
            >
              Reset
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
      {showInfo && (
  <div
    className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white px-4 py-5 w-72 shadow-2xl mb-4 rounded-2xl border border-gray-300 mx-auto animate-fade-in"
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
        { label: "Aggregate", text: "Specifies the aggregate function." }
      ].map((item, index) => (
        <div key={index}>
          <p className="text-gray-900 font-medium">{item.label}</p>
          <p className="text-gray-600">{item.text}</p>
        </div>
      ))}
    </div>

    <hr className="border-t border-dotted border-gray-400 my-4" />

    <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs border border-gray-300">
      <strong>Note</strong>
      <p>Aggregated columns should always have an alias.</p>
    </div>
  </div>
)}




    </>
  );
}