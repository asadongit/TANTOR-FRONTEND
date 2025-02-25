import React, { useState, useEffect, useCallback } from "react";
import { useStateContext } from "../../../../context/contextProvider";
import { X } from "lucide-react";

const getColumnGroupType = (columnType) => {
  if (!columnType) return null;
  const formattedColumnType = columnType.toLowerCase().replace(/\(.*\)/, "");
  let result = null;

  result = ["date", "timestamp"].includes(formattedColumnType)
    ? "DATE"
    : result;
  result = ["decimal","double"].includes(formattedColumnType) ? "NUMBER" : result;
  result = ["varchar"].includes(formattedColumnType) ? "STRING" : result;

  console.log("result ==>> ", result);
  return result;
};

const DynamicSelectOptions = ({ condition, index, updateCondition }) => {
  if (!condition.type) return null;
  let columnGroupType = getColumnGroupType(condition.type);
  console.log("columnGroupType ==>> ", columnGroupType);
  if (columnGroupType === "DATE" || columnGroupType === "NUMBER") {
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
  } else if (columnGroupType === "STRING") {
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
  } else {
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

const DynamicOptionValues = ({ condition, index, updateCondition }) => {
  if (!condition.operator) return null;

  let columnType = getColumnGroupType(condition.type);
  console.log("columnType", columnType);
  console.log("condition", condition);
  if (condition.operator === "between" && columnType === "DATE") {
    return (
      <>
        <input
          type="date"
          name="date"
          value={condition["value"]}
          onChange={(e) => updateCondition(index, "value", e.target.value)}
          style={{
            border: "1px solid grey",
            width: "200px",
            padding: "12px",
            borderRadius: "5px",
          }}
        />
        <input
          type="date"
          name="date"
          value={condition["value2"]}
          onChange={(e) => updateCondition(index, "value2", e.target.value)}
          style={{
            border: "1px solid grey",
            width: "200px",
            padding: "12px",
            borderRadius: "5px",
          }}
        />
      </>
    );
  }
  if (condition.operator === "between" && columnType === "NUMBER") {
    return (
      <>
        <input
          type="text"
          placeholder="Value"
          value={condition.value}
          onChange={(e) => updateCondition(index, "value", e.target.value)}
          className="border p-1.5 rounded w-[200px]"
        />
        <input
          type="text"
          placeholder="Value"
          hidden={condition.operator !== "between"}
          value={condition["value2"]}
          onChange={(e) => updateCondition(index, "value2", e.target.value)}
          className="border p-1.5 rounded w-[200px]"
        />
      </>
    );
  }

  return (
    <input
      type="text"
      placeholder="Value"
      value={condition.value}
      onChange={(e) => updateCondition(index, "value", e.target.value)}
      className="border p-1.5 rounded w-[200px]"
    />
  );
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
          operator: "",
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
            return {
              ...condition,
              [field]: value,
              type: columnType,
              value: "",
              value2: "",
              operator: "=",
            };
          else if (field === "operator")
            return { ...condition, [field]: value, value: "", value2: "" };
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
          <h2 className="text-xl font-semibold">Filter</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
            className="text-2xl"
          >
            <X />
          </button>
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
                <DynamicOptionValues
                  condition={condition}
                  index={index}
                  updateCondition={updateCondition}
                />
                {/* <input
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
                /> */}
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
          <button
            onClick={() => onApply(null, null)}
            className="px-4 py-2 bg-[#8E77BB] text-white rounded hover:bg-opacity-80"
          >
            Skip
          </button>
          <button
            onClick={(e) => setConditions([])}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Clear
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
