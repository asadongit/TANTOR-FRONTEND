/*eslint-disable*/
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, Network, ChevronDown, ChevronUp } from "lucide-react";
import { useStateContext } from "../../../../context/contextProvider";
import { Modal, Box, IconButton, Typography } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";

export function ConsolidationNode({ id }) {
  const { consolidationPayload, connectionPayload, viewPayload, handleFinalPayload, finalPayload, columnSettings} = useStateContext("");
  const [type, setType] = useState("Join");
  const [unionType, setUnionType] = useState("");

  const [leftColumns, setLeftColumns] = useState([]);
  const [rightColumns, setRightColumns] = useState([]);

  const [selectedLeft, setSelectedLeft] = useState("")
  const [selectedRight, setSelectedRight] = useState("")

  const [view1, setLeftView] = useState("")
  const [view2, setRightView] = useState("")

  const [joinType, setJoinType] = useState("")
  const [operator, setOperator] = useState("")


  const [joins, setJoins] = useState([])

  useEffect(() => {
    console.log("id of consolidation is ===>", id);
    console.log("consolidation is ===>", consolidationPayload);
    console.log("viewPayload is ==>", viewPayload);
    console.log("connection payload is ===>", connectionPayload);

    consolidationPayload.forEach((payload) => {
      if (payload.target === id) {
        const matchingView =
          connectionPayload.find((conn) => conn.id === payload.source) ||
          viewPayload.find((view) => view.id === payload.source);

        if (matchingView) {
          console.log("left columns are ===>", matchingView.Columns);
          setLeftColumns(matchingView.Columns);
          setLeftView(matchingView.view);
        }
      }

      if (payload.source === id) {
        const matchingView =
          connectionPayload.find((conn) => conn.id === payload.target) ||
          viewPayload.find((view) => view.id === payload.target);

        if (matchingView) {
          console.log("right columns are ===>", matchingView.Columns);
          setRightColumns(matchingView.Columns);
          setRightView(matchingView.view);
        }
      }
    });

  }, [type, id, consolidationPayload, connectionPayload, viewPayload]);

  useEffect(() => {
    if (view1 && view2 && joinType && selectedLeft && selectedRight && operator) {
      // Find the matching connection payloads for view1 and view2
      const connection2 = connectionPayload.find(conn => conn.view === view2);

      const newJoin = {
        id,
        view1,
        view2,
        join_type: joinType,
        on: [selectedLeft, selectedRight],
        operator,
      };

      if (connection2) newJoin.definition = connection2.def;

      console.log("wnateddd join ====>", newJoin)
      setJoins([newJoin]);
    }
  }, [view1, view2, joinType, selectedLeft, selectedRight, operator, connectionPayload]);


  useEffect(() => {
    console.log("joins are ===>",joins)
    if (joins.length > 0) {

      handleFinalPayload({
        joins: finalPayload && Array.isArray(finalPayload.joins)
          ? [
            ...finalPayload.joins.filter(
              (existingJoin) => !joins.some((newJoin) => newJoin.id === existingJoin.id)
            ),
            ...joins,
          ]
          : [...joins],
      });
    }
  }, [joins]);


  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };


  const handleSave = () => {

    if (type === "Join") {
      console.log("@@@@@@@@@@@@@@join payload is ===>", finalPayload)

      const tempArray1 = new Set();
      const tempArray2 = new Set();

      finalPayload.joins.forEach((join) => {
        const { view1, view2 } = join;

        if (!tempArray2.has(view1)) {
          tempArray1.add(view1);
        }
        if (!tempArray1.has(view2)) {
          tempArray2.add(view2);
        }

        tempArray1.delete(view2);
      });

      console.log("temp array 1===>",tempArray1)
      console.log("temp array 2===>",tempArray2)

      const baseJoin = Array.from(tempArray1)[0];
      const connection = connectionPayload.find(conn => conn.id === baseJoin);

      console.log("base join is===>",baseJoin)


      // const connectionSelectFields = connectionPayload?.flatMap((conn) => conn.select_fields || []) || [];
      // const viewSelectFields = [...(viewPayload?.flatMap((view) => view.select_fields || []) || []), ...connectionSelectFields];

      // console.log("ViewSELECT FILESDSS ======>", viewSelectFields)


      const newPayload = {
        ...finalPayload,
        base_join: baseJoin,
        ...(connection && { base_join_def: connection.def }),
        command: "execute",
        view_type: "Integrated View",
        view_name: "MYVIEW",
        isMateralizedView: "false",
        isCaching: "false",
        // select_fields: viewSelectFields,
      }

      handleFinalPayload(newPayload);

      // const newPayload ={
      //   ...finalPayload,
      //   joins: finalPayload.joins.map(({ id, ...rest }) => rest),
      //   base_join: baseJoin,
      //   ...(connection && { base_join_def: connection.def }),
      //    command: "execute"
      // }

      // handlefinalPayload(newPayload);
    }

    if (type === "Union" || type === "Intersect" || type === "Union All" || type === "Intersect All") {
      if ((viewPayload && viewPayload.length > 0) || (connectionPayload && connectionPayload.length > 0)) {

        const unions = [
          ...(viewPayload ? viewPayload.map(node => node.view) : []),
          ...(connectionPayload ? connectionPayload.map(node => node.view) : [])
        ];


        const unionData = {};
        [...viewPayload, ...connectionPayload].forEach((item) => {
          unionData[item.view] = item.selectedColumns;
        });

        console.log("union data is ===>",unionData)


        const defs = {};
        connectionPayload.forEach((item) => {
          if (item.view && item.def) {
            defs[item.view] = item.def;
          }
        });


        // const [firstKey, firstValue] = Object.entries(unionData)[0];

        // const select_fields = firstValue.map(field => ({
        //   field: field,
        //   alias: ""
        // }));

        // console.log("select fields aree===>",select_fields)

        const newPayload = {
          operation: unionType,
          command: "execute",
          view_type: "Integrated View",
          view_name: "MYVIEW",
          isMateralizedView: "false",
          isCaching: "false",
          union: unions,
          union_fields: unionData,
          defs: defs,
        }

        handleFinalPayload(newPayload);
        console.log(" union newpayload after is =====>", newPayload)
      }
    }

    setIsModalOpen(!isModalOpen);
  };

  const handleType = (type) =>{
    handleFinalPayload({});
    setType(type)
    setSelectedLeft("")
    setSelectedRight("")
    setJoinType("")
    setOperator("")
     }

  const handleClear = () =>{
    handleFinalPayload({});
    setSelectedLeft("")
    setSelectedRight("")
    setJoinType("")
    setOperator("")
  }

  return (
    <>
      <div className="bg-[#8E77BB] rounded-full p-6 shadow-lg relative group flex justify-center">
        <button
          onClick={() => window.deleteNode?.(id)}
          className="absolute -top-2 -right-2 bg-black rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <Network className="w-7 h-7 text-white" onClick={toggleModal} />
      </div>

      <Modal open={isModalOpen} onClose={toggleModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40%",
            height: "50%",
            bgcolor: "background.paper",
            px: 4,
            pt: 2,
            borderRadius: "12px",
          }}
        >
          <div className="h-[10%]" style={{ height: "10%" }}>
            <div className="flex items-center space-x-3">
              <Network className="w-5 h-5 text-[#8E77BB]" />
              <h3 className="text-[#8E77BB] font-medium">Consolidation</h3>
            </div>
            <IconButton
              onClick={toggleModal}
              sx={{ position: "absolute", top: 8, right: 15 }}
            >
              <X className="w-6 h-6" />
            </IconButton>
          </div>
          <div className="h-[90%] mt-3 flex justify-between flex-col" style={{ height: "90%" }}>

            <div className="h-[70%]" style={{ height: "70%" }}>
              <div className="flex text-sm space-x-2">
                <button
                  onClick={() => {
                    handleType("Join")  
                  }}
                  className={`w-[7rem] h-[2.25rem] py-1 rounded-full border transition-all duration-300 flex items-center justify-center ${type === "Join" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                    }`}
                >
                  Join
                </button>
                <button
                  onClick={() => {
                    handleType("Union") 
                  }}
                  className={`w-[7rem] h-[2.25rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${type === "Union" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                    }`}
                >
                  Union
                </button>
                <button
                  onClick={() => {
                    handleType("Intersect") 
                  }}
                  className={`w-[7rem] h-[2.25rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${type === "Intersect" ? "border-[#8E77BB] text-[#8E77BB]" : "border-solid border-2 text-gray-700"
                    }`}
                >
                  Intersect
                </button>
              </div>
              {type === "Join" && (
                <>
                  <div className="flex w-full justify-between mt-3">
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
                  <div className="flex w-full justify-between mt-3">
                    <div className="w-[47%]">
                      <label className="block text-sm font-medium text-black mb-1">Type</label>
                      <select
                        value={joinType}
                        className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
                        onChange={(e) => setJoinType(e.target.value)}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Inner Join">Inner Join</option>
                        <option value="Left Join">Left Join</option>
                        <option value="Right Join">Right Join</option>
                        <option value="Full Join">Full Join</option>
                      </select>
                    </div>
                    <div className="w-[47%]">
                      <label className="block text-sm font-medium text-black mb-1">Operator</label>
                      <select
                        value={operator}
                        className="w-full bg-white rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg group border-solid border-2"
                        onChange={(e) => setOperator(e.target.value)}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="=">=</option>
                        <option value="&gt;=">&gt;=</option>
                        <option value="&lt;=">&lt;=</option>
                        <option value="&gt;">&gt;</option>
                        <option value="&lt;">&lt;</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {(type === "Union" || type === "Intersect") && (
                <div className="flex gap-4 mt-10">
                  <div
                    onClick={() => setUnionType(`${type}`)}
                    className={`w-full sm:w-[9rem] h-14 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${unionType === `${type}`
                      ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                      : "border-solid border-2 text-gray-700"
                      }`}
                  >
                    {type}
                  </div>
                  <div
                    onClick={() => setUnionType(`${type} All`)}
                    className={`w-full sm:w-[9rem] h-14 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${unionType === `${type} All`
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
              <div className="mb-4 " style={{ height: "20%" }}>
                <button
                onClick={handleClear}
                  type="button"
                  className="text-black bg-white hover:bg-gray-50 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-2 me-2 mb-2 focus:outline-none border-solid border-2"
                >
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  type="button"
                  className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-2 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  Save
                </button>
              </div>
            )}
          </div>

        </Box>
      </Modal>

    </>
  );
}

ConsolidationNode.propTypes = {
  id: PropTypes.string.isRequired,
};
