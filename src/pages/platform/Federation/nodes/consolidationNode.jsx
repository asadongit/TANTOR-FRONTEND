import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, Network, ChevronDown, ChevronUp } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";

export function ConsolidationNode({ id }) {
  const { consolidationPayload, connectionPayload, viewPayload } = useStateContext("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [type, setType] = useState("");
  const [unionType, setUnionType] = useState("");

  const [leftColumns, setLeftColumns] = useState([]);
  const [rightColumns, setRightColumns] = useState([]);

  const [selectedLeft, setSelectedLeft] = useState("")
  const [selectedRight, setSelectedRight] = useState("")

  const [view1,setLeftView] = useState("")
  const [view2, setRightView] = useState("")

  const [joinType, setJoinType] = useState("")
  const [operator, setOperator] = useState("")


  const [joins, setJoins] = useState([])

  useEffect(() => {
    console.log("id of consolidation is ===>", id);
    console.log("consolidation is ===>", consolidationPayload);
    console.log("viewpayload is ==>", viewPayload);
    console.log("connection payload is ===>", connectionPayload);

    consolidationPayload.forEach((payload) => {
      if (payload.target === id) {
        if (payload.source === connectionPayload.id) {
          console.log("left columns are ===>",connectionPayload.Columns)
          setLeftColumns(connectionPayload.Columns);
          // setLeftView(connectionPayload.)
        }
        else if(payload.source === viewPayload.id){
          console.log("left columns are ===>",viewPayload.Columns)
          setLeftColumns(viewPayload.Columns);
          setLeftView(viewPayload.selectedView)
        }
      }

      if (payload.source === id) {
        if (payload.target === viewPayload.id) {
          console.log("right columns aree===>",viewPayload.Columns)
          setRightColumns(viewPayload.Columns);
          setRightView(viewPayload.selectedView)
        }
        else if (payload.target === connectionPayload.id) {
          console.log("right columns are ===>",connectionPayload.Columns)
          setRightColumns(connectionPayload.Columns);
          // setRightView(connectionPayload.)
        }
      }
    });
  }, [type, id, consolidationPayload, connectionPayload, viewPayload]);

  useEffect(()=>{
    const newJoin = {
      view1,
      view2,
      join_type: joinType,
      on: [
        { selectedLeft },
        { selectedRight }
      ],
      operator
    };
    setJoins(prevJoins => [...prevJoins, newJoin]);

  },[view1,view2,joinType,selectedLeft,selectedRight,operator])

  return (
    <>
      {!isCollapsed ? (
        <>
          <div className="bg-white rounded-lg p-4 shadow-lg min-w-[300px] relative group">
            <button
              onClick={() => window.deleteNode?.(id)}
              className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Network className="w-5 h-5 text-[#8E77BB]" />
                <h3 className="text-[#8E77BB] font-medium">Consolidation</h3>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md hover:bg-gray-200"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-black" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-black" />
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex mt-2 text-sm justify-between">
                <button
                  onClick={() => setType("Join")}
                  className={`w-[5rem] h-[2.25rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    type === "Join" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                  }`}
                >
                  Join
                </button>
                <button
                  onClick={() => setType("Union")}
                  className={`w-[5rem] h-[2.25rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    type === "Union" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                  }`}
                >
                  Union
                </button>
                <button
                  onClick={() => setType("Intersect")}
                  className={`w-[5rem] h-[2.25rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    type === "Intersect" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                  }`}
                >
                  Intersect
                </button>
              </div>
              {type === "Join" && (
                <>
                                   <div className="flex w-full justify-between">
  <div className="w-[47%]">
    <label className="block text-sm font-medium text-black mb-1">Left</label>
    <select
      className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
      value={selectedLeft}
      onChange={(e) => setSelectedLeft(e.target.value)} 
    >
      <option value="" disabled>
        Select
      </option>
      {leftColumns.map((col, index) => (
        <option key={index} value={col}>
          {col}
        </option>
      ))}
    </select>
  </div>
  <div className="w-[47%]">
    <label className="block text-sm font-medium text-black mb-1">Right</label>
    <select
      className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
      value={selectedRight} 
      onChange={(e) => setSelectedRight(e.target.value)} 
    >
      <option value="" disabled>
        Select
      </option>
      {rightColumns.map((col, index) => (
        <option key={index} value={col}>
          {col}
        </option>
      ))}
    </select>
  </div>
</div>
                  <div className="flex w-full justify-between">
                    <div className="w-[47%]">
                      <label className="block text-sm font-medium text-black mb-1">Type</label>
                      <select
                        className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
                        onChange={(e) => setJoinType(e.target.value)} 
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Column1">Inner</option>
                        <option value="Column2">Outer</option>
                        <option value="Column3">Left</option>
                      </select>
                    </div>
                    <div className="w-[47%]">
                      <label className="block text-sm font-medium text-black mb-1">Operator</label>
                      <select
                        className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
                        onChange={(e) => setOperator(e.target.value)} 
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Column1">=</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {(type === "Union" || type === "Intersect") && (
                <div className="flex gap-4 mt-6">
                  <div
                    onClick={() => setUnionType("Union")}
                    className={`w-full sm:w-[9rem] h-14 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${
                      unionType === "Union"
                        ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                        : "border-solid border-2 text-gray-700"
                    }`}
                  >
                    {type}
                  </div>
                  <div
                    onClick={() => setUnionType("Union All")}
                    className={`w-full sm:w-[9rem] h-14 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${
                      unionType === "Union All"
                        ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                        : "border-solid border-2 text-gray-700"
                    }`}
                  >
                    {type} All
                  </div>
                </div>
              )}
            </div>

            {(type === "Join" || type === "Union" || type === "Intersect") && (
              <div className="mt-4">
                <button
                  type="button"
                  className="text-black bg-white hover:bg-gray-50 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-2 me-2 mb-2 focus:outline-none border-solid border-2"
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-2 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#8E77BB] rounded-full p-5 shadow-lg relative group">
          <button
            onClick={() => window.deleteNode?.(id)}
            className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />

          <Network className="w-7 h-7 text-white" onClick={() => setIsCollapsed(!isCollapsed)} />
        </div>
      )}
    </>
  );
}

ConsolidationNode.propTypes = {
  id: PropTypes.string.isRequired,
};
