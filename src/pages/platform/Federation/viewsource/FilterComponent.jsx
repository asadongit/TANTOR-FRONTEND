import React, { useState, useEffect, useCallback } from "react";
import { useStateContext } from "../../../../context/contextProvider";
import { X } from "lucide-react";

const getColumnGroupType = (columnType) => {
  if(!columnType) return null;
  const formattedColumnType = columnType.toLowerCase().replace(/\(.*\)/, "");
  let result = null; 
  
  result = ["date", "timestamp"].includes(formattedColumnType) ? "DATE" : result;
  result = ["decimal"].includes(formattedColumnType) ? "NUMBER" : result;
  result = ["varchar"].includes(formattedColumnType) ? "STRING" : result;

  console.log("result ==>> ", result);
  return result;
};
const DatePicker = () => {
  return (
    <div class="relative max-w-sm">
      <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
        {/* <svg
          class="w-4 h-4 text-gray-500 dark:text-gray-400"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
        </svg> */}
      </div>
      <input
        id="datepicker-actions"
        datepicker
        datepicker-buttons
        datepicker-autoselect-today
        type="text"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        placeholder="Select date"
      />
    </div>
  );
};
const DynamicSelectOptions = ({
  condition,
  index,
  updateCondition,
}) => {
  if(!condition.type) return null;
  let columnGroupType = getColumnGroupType(condition.type);

  if(columnGroupType === "DATE" || columnGroupType === "NUMBER"){
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition(index, "operator", e.target.value)}
        className="border p-1.5 rounded w-20"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value=">">{">"}</option>
        <option value="<">{"<"}</option>
        <option value=">=">{"≥"}</option>
        <option value="<=">{"≤"}</option>
        <option value="between"> Between </option>
      </select>
    );
  }else if(columnGroupType === "STRING"){
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition(index, "operator", e.target.value)}
        className="border p-1.5 rounded w-20"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
      </select>
    );
  }else{
    return (
      <select
        value={condition.operator}
        onChange={(e) => updateCondition(index, "operator", e.target.value)}
        className="border p-1.5 rounded w-20"
      >
        <option value="=">=</option>
        <option value="!=">!=</option>
        <option value=">">{">"}</option>
        <option value="<">{"<"}</option>
        <option value=">=">{"≥"}</option>
        <option value="<=">{"≤"}</option>
      </select>
    );
  }
};
export default function FilterComponent({ setIsOpen, columns, onApply }) {
  console.log("COLUMNS ++>> ", columns);

  const { userSelections } = useStateContext();

  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    const filterData = userSelections?.get("apiPayload")?.filter_data;
    console.log("USE CALLBACK ===>> ", userSelections);
    if (filterData) setConditions(filterData);
  }, [userSelections]);

  useEffect(() => console.log("CONDITIONS ++>> ", conditions), [conditions]);

  const addCondition = () => {
    setConditions((prevConditions) => {
      let condition = null;
      if (prevConditions.length !== 0) {
        prevConditions[prevConditions.length - 1].child = prevConditions.length;
        condition = "and";
      }

      return [
        ...prevConditions,
        {
          column: "",
          operator: "=",
          value: "",
          value2: null,
          condition: condition,
          child: null,
          type: null,
        },
      ];
    });
  };

  const updateCondition = (index, field, value) => {
    let columnType = null;

    if (field === "column") {
      const columnIndex = columns.findIndex((column) => column.name === value);
      columnType = columns[columnIndex].type;
    }

    setConditions((prevConditions) => {
      return prevConditions.map((condition, i) => {
        if (i === index) {
          if (columnType)
            return { ...condition, [field]: value, type: columnType, value: "", value2: "", operator: "=" };
          return { ...condition, [field]: value };
        }
        return condition;
      });
    });
  };
  const removeCondition = (index) => {
    setConditions((prevConditions) => {
      if (prevConditions.length === 1) {
        return [];
      }

      let newConditions = [...prevConditions];

      if (index === newConditions.length - 1) {
        if (index > 0) {
          newConditions[index - 1].child = null;
        }
        return newConditions.slice(0, -1);
      }

      for (let i = index; i < newConditions.length - 1; i++) {
        console.log(i);
        newConditions[i] = { ...newConditions[i + 1], child: i + 1 };
      }

      newConditions = newConditions.slice(0, -1);
      newConditions[newConditions.length - 1].child = null;
      newConditions[0].condition = null;
      return newConditions;
    });
  };
  return (
    <div className="fixed inset-0 text-['Proxima Nova'] bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[80vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-2 pl-4 border-b flex justify-between items-center bg-[#282F49] text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Query Builder</h2>
          {/* <button onClick={onClose} className="text-2xl">&times;</button> */}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto">
          {conditions.map((condition, index) => (
            <div key={index} className="mb-4">
              {index > 0 && (
                <div className="mb-1 mt-6">
                  <select
                    value={condition.condition}
                    onChange={(e) =>
                      updateCondition(index, "condition", e.target.value)
                    }
                    className="border p-1.5 rounded w-24 bg-gray-100 text-sm"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 items-start p-2 bg-gray-50 rounded">
                <select
                  value={condition.column}
                  onChange={(e) =>
                    updateCondition(index, "column", e.target.value)
                  }
                  className="border p-1.5 rounded w-[200px]"
                >
                  <option value="">Select Column</option>
                  {columns.map((column, colIndex) => (
                    <option key={colIndex} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
                {/* <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="border p-1.5 rounded w-20"
                  >
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value=">">{">"}</option>
                    <option value="<">{"<"}</option>
                    <option value=">=">{"≥"}</option>
                    <option value="<=">{"≤"}</option>
                  </select> */}
                <DynamicSelectOptions
                  condition={condition}
                  index={index}
                  updateCondition={updateCondition}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) =>
                    updateCondition(index, "value", e.target.value)
                  }
                  className="border p-1.5 rounded w-[200px]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  hidden={condition.operator !== "between"}
                  value={condition["value2"]}
                  onChange={(e) =>
                    updateCondition(index, "value2", e.target.value)
                  }
                  className="border p-1.5 rounded w-[200px]"
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="mt-1 p-1.5 text-red-500 hover:text-red-800 hover:bg-[#b6b3bb] rounded-lg"
                >
                  <X className="h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCondition}
            className="mt-2 px-2 text-sm py-2 font-semibold bg-[#8E77BB] text-white rounded-lg hover:bg-opacity-80"
          >
            Add Condition
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-4">
          {/* <button
              onClick={() => onApply(null,null)}
              className="px-4 py-2 bg-[#cecece] text-white rounded hover:bg-opacity-80"
            >
              Skip
            </button> */}
          <button
            onClick={(e) => setIsOpen(false)}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(null, conditions)}
            className="px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-80"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
