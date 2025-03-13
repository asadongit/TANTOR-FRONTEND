/*eslint-disable*/
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { SquareKanban, X, Network, ChevronDown, ChevronUp, Pencil, MoveHorizontal } from "lucide-react";
import { useStateContext } from "../context/contextViewProvider";
import { Modal, Box, IconButton, Autocomplete, TextField } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { Circle } from 'lucide-react';
import { Columns } from "../BusinessView/Columns";
 
export function ConsolidationNode({ id }) {
  const { handleConnectionPayload, handleViewPayload, consolidationPayload, connectionPayload, viewPayload, handleFinalPayload, finalPayload, columnSettings, setColumnSettings } = useStateContext("");
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
  const [columns, setColumns] = useState([])
  const [selectedUnionColumns, setSelectedUnionColumns] = useState([])
 
  const [colId, setColId] = useState("Union")
 
  useEffect(() => {
    console.log("COLUMN SETTTINGS ARE ======>", columnSettings)
    console.log("finalpayload operation is ======>", finalPayload.operation)
    console.log("finalpayload operation is ======>", finalPayload.operation);
 
    if (!finalPayload.joins || finalPayload.joins.length === 0 || !finalPayload.joins.some(join => join.id === id)) {
      setSelectedLeft("")
      setSelectedRight("")
      setJoinType("")
      setOperator("")
    }
 
    if (finalPayload?.operation) {
 
      const updatedOperation = finalPayload.operation.endsWith(" All")
        ? finalPayload.operation.replace(/ All$/, "")
        : finalPayload.operation;
 
      setType(updatedOperation);
      setUnionType(finalPayload.operation);
    }
 
  }, [finalPayload]);
 
 
  const [firstView, setFirstView] = useState("")
  const [secondView, setSecondView] = useState("")
 
  useEffect(() => {
    console.log("id of consolidation is ===>", id);
    console.log("consolidation is ===>", consolidationPayload);
    console.log("viewPayload is ==>", viewPayload);
    console.log("connection payload is ===>", connectionPayload);
 
    if (type === "Join") {
      consolidationPayload.forEach((payload) => {
        if (payload.target === id) {
          const matchingView =
            connectionPayload.find((conn) => conn.id === payload.source) ||
            viewPayload.find((view) => view.id === payload.source);
 
          if (matchingView) {
            console.log("left columns are ===>", matchingView.Columns);
            const columnNames = matchingView.Columns.map(col => col.column_name || col.column);
            setLeftColumns(columnNames);
            setLeftView(matchingView.view);
          }
        }
 
        if (payload.source === id) {
          const matchingView =
            connectionPayload.find((conn) => conn.id === payload.target) ||
            viewPayload.find((view) => view.id === payload.target);
 
          if (matchingView) {
            console.log("right columns are ===>", matchingView.Columns);
            const columnNames = matchingView.Columns.map(col => col.column_name || col.column);
            setRightColumns(columnNames);
            setRightView(matchingView.view);
          }
        }
      });
    }
    else if (type === "Union") {
      consolidationPayload.forEach((payload) => {
        if (payload.target === id) {
          const matchingView =
            connectionPayload.find((conn) => conn.id === payload.source) ||
            viewPayload.find((view) => view.id === payload.source);
 
          if (matchingView) {
            console.log("LEFT SIDE ISSSSSS&&&&&&&&&&&&&&===>", matchingView.view);
            setFirstView(matchingView.view)
          }
        }
 
        if (payload.source === id) {
          const matchingView =
            connectionPayload.find((conn) => conn.id === payload.target) ||
            viewPayload.find((view) => view.id === payload.target);
 
          if (matchingView) {
            console.log("RIGHT SIDE ISSSSSS&&&&&&&&&&&&&&===>", matchingView.view);
            setSecondView(matchingView.view)
          }
        }
      });
    }
  }, [type, id, consolidationPayload, connectionPayload, viewPayload]);
 
  useEffect(() => {
    if (view1 && view2 && joinType && selectedLeft && selectedRight && operator && isConsolidationModalOpen) {
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
 
      console.log("wanteddd join ====>", newJoin)
      setJoins([newJoin]);
    }
  }, [view1, view2, joinType, selectedLeft, selectedRight, operator, connectionPayload]);
 
 
  // useEffect(() => {
  //   console.log("joins are ===>", joins)
  //   if (joins.length > 0) {
 
  //     handleFinalPayload({
  //       joins: finalPayload && Array.isArray(finalPayload.joins)
  //         ? [
  //           ...finalPayload.joins.filter(
  //             (existingJoin) => !joins.some((newJoin) => newJoin.id === existingJoin.id)
  //           ),
  //           ...joins,
  //         ]
  //         : [...joins],
  //     });
  //   }
  // }, [joins]);
 
 
  const [isUnionModalOpen, setIsUnionModalOpen] = useState(false);
 
 
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
 
  const toggleConsolidationModal = () => {
    console.log("checking the selected columns", finalPayload)
    if (columnSettings?.Union) {
      setSelectedUnionColumns(
        Object.entries(columnSettings.Union)
          .filter(([_, value]) => value.output === "Yes")
          .map(([key]) => key)
      );
    } else {
      setSelectedUnionColumns([]);
    }
    setIsConsolidationModalOpen(!isConsolidationModalOpen);
  };
 
  useEffect(() => {
    console.log("viewPayload in consolidation is =====>", viewPayload);
    console.log("connection payload in consolidation is ====>", connectionPayload);
 
    if (type === "Union") {
      const unionData = {};
      [...viewPayload, ...connectionPayload].forEach((item) => {
        if (item.view && Array.isArray(item.selectedColumns)) {
          unionData[item.view] = item.selectedColumns;
        }
      });
 
      console.log("union data is ===>", unionData);
 
      const firstKey = Object.keys(unionData)[0];
      const firstKeyColumns = unionData[firstKey] || [];
 
      console.log("first key columns for union is ===>", firstKeyColumns);
      setColumns(firstKeyColumns);
 
      const columnTypeMap = {};
      [...viewPayload, ...connectionPayload].forEach((item) => {
        if (Array.isArray(item.Columns)) {
          item.Columns.forEach((col) => {
            columnTypeMap[col.column_name || col.column] = col.data_type || col.datatype;
          });
        }
      });
 
      if (Array.isArray(firstKeyColumns)) {
        const formattedPayload = firstKeyColumns.map((col) => ({
          name: col,
          type: columnTypeMap[col] || "unknown"
        }));
 
        console.log("Formatted Payload ===>", formattedPayload);
 
        handleFinalPayload({
          ...finalPayload,
          columnsDataType: formattedPayload
        })
 
      } else {
        console.error("firstKeyColumns is not an array:", firstKeyColumns);
      }
    }
  }, [viewPayload, connectionPayload, type]);
 
 
  const handleSave = () => {
 
    // checkConsolidation();
 
    console.log("type is =====>", type);
 
    if (type === "Join") {
 
      if (!(joinType && selectedLeft && selectedRight && operator)) {
        toast.error("Select input first")
        return;
      }
 
 
      console.log("joins are ===>", joins)
 
      let updatedJoins = [];
      if (joins.length > 0) {
        updatedJoins =
          finalPayload && Array.isArray(finalPayload.joins)
            ? [
              ...finalPayload.joins.filter(
                (existingJoin) => !joins.some((newJoin) => newJoin.id === existingJoin.id)
              ),
              ...joins,
            ]
            : [...joins];
      }
 
      let columnsPayload = [];
 
      viewPayload.forEach(view => {
        view.Columns.forEach(column => {
          columnsPayload.push({
            name: `${view.view}.${column.column_name}`,
            type: column.data_type
          });
        });
      });
 
      connectionPayload.forEach(connection => {
        connection.Columns.forEach(column => {
          columnsPayload.push({
            name: `${connection.view}.${column.column}`,
            type: column.datatype
          });
        });
      });
 
      console.log("columns payload in the join is =====>", columnsPayload)
 
      console.log("@@@@@@@@@@@@@@join payload is ===>", finalPayload)
 
 
      const allJoins = [...(finalPayload?.joins || []), ...updatedJoins];
 
      const tempArray1 = new Set();
      const tempArray2 = new Set();
 
      allJoins.forEach((join) => {
        const { view1, view2 } = join;
 
        if (!tempArray2.has(view1)) {
          tempArray1.add(view1);
        }
        if (!tempArray1.has(view2)) {
          tempArray2.add(view2);
        }
 
        tempArray1.delete(view2);
      });
 
      console.log("temp array 1===>", tempArray1);
      console.log("temp array 2===>", tempArray2);
 
      const baseJoin = Array.from(tempArray1)[0];
      const connection = connectionPayload.find(conn => conn.id === baseJoin);
 
      console.log("base join is===>", baseJoin);
 
 
 
      const newPayload = {
        ...finalPayload,
        joins: updatedJoins.length > 0 ? updatedJoins : finalPayload?.joins || [],
        columnsDataType: columnsPayload,
        view_name: "MYVIEW",
        isMateralizedView: "false",
        isCaching: "false",
        base_join: baseJoin,
        ...(connection && { base_join_def: connection.def }),
        command: "execute",
        view_type: "Integrated View"
      }
 
      handleFinalPayload({ ...finalPayload, ...newPayload });
    }
    toast.success("Data Saved Successfully");
 
    setIsConsolidationModalOpen(!isConsolidationModalOpen);
  };
 
  const handleUnionNext = () => {
    if (type === "Union" || type === "Intersect" || type === "Union All" || type === "Intersect All") {
      if (unionType == "") {
        toast.error("Select type first");
        return;
      }
      if (selectedUnionColumns.length === 0) {
        toast.error("Select atleast one column");
        return;
      }
 
      if ((viewPayload && viewPayload.length > 0) || (connectionPayload && connectionPayload.length > 0)) {
        setIsUnionModalOpen(true)
        const unions = [
          ...(viewPayload ? viewPayload.map(node => node.view) : []),
          ...(connectionPayload ? connectionPayload.map(node => node.view) : [])
        ];
 
 
        const unionData = {};
        [...viewPayload, ...connectionPayload].forEach((item) => {
          unionData[item.view] = item.selectedColumns;
        });
 
        console.log("union data is ===>", unionData)
 
 
        const defs = {};
        connectionPayload.forEach((item) => {
          if (item.view && item.def) {
            defs[item.view] = item.def;
          }
        });
 
        const newPayload = {
          operation: unionType,
          view_type: "Integrated View",
          isMateralizedView: "false",
          isCaching: "false",
          view_name: "MYVIEW",
          union: unions,
          union_fields: unionData,
          defs: defs,
        }
 
        handleFinalPayload({ ...finalPayload, ...newPayload });
        console.log(" union newpayload after is =====>", newPayload)
      }
    }
  }
 
  const handleType = (type) => {
    console.log("handle typeeee")
    handleFinalPayload(prevPayload => ({
      columnsDataType: prevPayload?.columnsDataType || {}
    }));
 
    setType(type)
    setSelectedLeft("")
    setSelectedRight("")
    setJoinType("")
    setOperator("")
  }
 
  const handleClear = () => {
    handleFinalPayload(prevPayload => ({
      columnsDataType: prevPayload?.columnsDataType || {}
    }));
    setSelectedLeft("")
    setSelectedRight("")
    setJoinType("")
    setOperator("")
  }
 
  const handleColumnChange = (column) => {
    console.log("column settings in union are======>", columnSettings)
    setSelectedUnionColumns((prev) => {
      if (prev.includes(column)) {
        setColumnSettings((prevSettings) => {
          const updatedSettings = { ...prevSettings };
          if (updatedSettings[colId]) {
            delete updatedSettings[colId][column];
            if (Object.keys(updatedSettings[colId]).length === 0) {
              delete updatedSettings[colId];
            }
          }
          return updatedSettings;
        });
        return prev.filter((col) => col !== column);
      } else {
        setColumnSettings((prevSettings) => ({
          ...prevSettings,
          [colId]: {
            ...(prevSettings[colId] || {}),
            [column]: {
              ...(prevSettings[colId]?.[column] || {}),
              output: "Yes",
            },
          },
        }));
        return [...prev, column];
      }
    });
  };
 
 
  const handleChange = (column) => {
    toggleModal(true);
    setSelectedColumn(column);
  }
 
  const handleSelectAllChange = (isChecked) => {
    if (isChecked) {
      setSelectedUnionColumns(columns);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columns.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: {
              ...(updatedSettings[colId]?.[column] || {}),
              output: "Yes",
            },
          };
        });
        return updatedSettings;
      });
    } else {
      setSelectedUnionColumns([]);
      setColumnSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings };
        columns.forEach((column) => {
          updatedSettings[colId] = {
            ...updatedSettings[colId],
            [column]: {
              ...(updatedSettings[colId]?.[column] || {}),
              output: "No",
            },
          };
        });
        return updatedSettings;
      });
    }
  };
 
  const isAllSelected = (selectedUnionColumns?.length || 0) === (columns?.length || 0);
 
  useEffect(() => {
    if (columnSettings["Union"]) {
      const columnsWithOutputYes = Object.keys(columnSettings["Union"]).filter(
        column => columnSettings["Union"][column].output === "Yes"
      );
      setSelectedUnionColumns(columnsWithOutputYes);
    }
  }, [columnSettings]);
 
 
  const [isModalOpen, setIsModalOpen] = useState(false);
 
  const toggleModal = (value) => {
    console.log("toggle model ")
    setIsModalOpen(value);
  };
 
  const [selectedColumn, setSelectedColumn] = useState("");
 
  const [mapping, setMapping] = useState({});
 
  const handleMappingChange = (source, target) => {
    setMapping((prev) => ({
      ...prev,
      [source]: target,
    }));
  };
 
  const handleMappingSave = () => {
    const updatedFields = finalPayload.union_fields[firstView].map((col) => mapping[col] || "");
 
    handleFinalPayload((prev) => {
      const updatedFinalPayload = {
        ...prev,
        union_fields: {
          ...prev.union_fields,
          [secondView]: updatedFields,
        },
      };
 
      handleViewPayload((prevView) =>
        prevView.map((item) => ({
          ...item,
          selectedColumns: updatedFinalPayload.union_fields[item.view] || item.selectedColumns,
        }))
      );
 
      handleConnectionPayload((prevConn) =>
        prevConn.map((item) => ({
          ...item,
          selectedColumns: updatedFinalPayload.union_fields[item.view] || item.selectedColumns,
        }))
      );
 
      return updatedFinalPayload;
    });
 
 
    setIsUnionModalOpen(false)
    setIsConsolidationModalOpen(false)
  }
 
  useEffect(() => {
    if (firstView && secondView && finalPayload?.union_fields?.[firstView] && finalPayload?.union_fields?.[secondView]) {
      const defaultMapping = {};
      finalPayload.union_fields[firstView].forEach((col, index) => {
        defaultMapping[col] = finalPayload.union_fields[secondView][index] || "";
      });
      setMapping(defaultMapping);
 
    }
  }, [firstView, secondView, finalPayload]);
 
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
 
        <Network className="w-7 h-7 text-white" onClick={toggleConsolidationModal} />
      </div>
 
      <Modal open={isConsolidationModalOpen} onClose={() => setIsConsolidationModalOpen(!isConsolidationModalOpen)}>
        <div className="max-w-[100vw] max-h-[80vh] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 pt-2 rounded-xl">
          <div className="h-[10%]" style={{ height: "10%" }}>
            <div className="flex items-center space-x-3">
              <Network className="w-5 h-5 text-[#8E77BB]" />
              <h3 className="text-[#8E77BB] font-medium">Consolidation</h3>
            </div>
            <IconButton
              onClick={() => setIsConsolidationModalOpen(!isConsolidationModalOpen)}
              sx={{ position: "absolute", top: 0, right: 8 }}
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
                  <div className="flex w-full justify-between mt-3 mb-6">
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
                <>
                  <div className="flex mt-3 w-full justify-between">
                    <div
                      onClick={() => setUnionType(`${type}`)}
                      className={`w-[49%] h-10 py-3 px-4 flex justify-between border rounded-md transition-all duration-300 flex items-center justify-center ${unionType === `${type}`
                        ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                        : "border-solid border-2 text-gray-700"
                        }`}
                    >
                      {type}
                      <Circle className={`w-4 h-4 rounded-lg ${unionType === `${type}`
                        ? "text-[#8E77BB] bg-[#8E77BB]"
                        : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div
                      onClick={() => setUnionType(`${type} All`)}
                      className={`w-[49%] h-10 py-3 px-4 flex justify-between border rounded-md transition-all duration-300 flex items-center justify-center ${unionType === `${type} All`
                        ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                        : "border-solid border-2 text-gray-700"
                        }`}
                    >
                      {`${type} All`}
                      <Circle
                        className={`w-4 h-4 rounded-lg ${unionType === `${type} All` ? "text-[#8E77BB] bg-[#8E77BB]" : "text-gray-400"
                          }`}
                      />
                    </div>
 
                  </div>
                  <div>
                    {columns?.length > 0 && (
                      <div>
                        <label className="mt-3 block text-sm font-medium text-black ">Select Columns</label>
                        <div className="px-3 pt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="selectAll"
                              checked={isAllSelected}
                              onChange={(e) => handleSelectAllChange(e.target.checked)}
                              className="text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
                              Select All
                            </label>
                          </div>
                          <div className="max-h-28 overflow-y-auto space-y-2 custom-scrollbar">
                            {columns.map((column) => (
                              <div className="flex justify-between">
                                <div key={column} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    onClick={(e) => {
                                      if (e.target.checked) {
                                        // toggleModal(true);
                                        setSelectedColumn(column);
 
                                      } else {
                                        setSelectedColumn("");
                                        // toggleModal(false);
                                      }
                                    }}
                                    id={column}
                                    value={column}
                                    checked={selectedUnionColumns.includes(column)}
                                    onChange={() => handleColumnChange(column)}
                                    className="text-purple-600 focus:ring-purple-500"
                                  />
                                  <label htmlFor={column} className="text-sm text-gray-700">
                                    {column}
                                  </label>
                                </div>
                                <Pencil name="edit"
                                  onClick={() => handleChange(column)}
                                  className="mr-3 h-4 w-4 text-[#8E77BB]" />
 
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
 
            {(type === "Join" || type === "Union" || type === "Intersect") && (
              <div className="mt-2 mb-1 flex justify-end" >
                <button
                  onClick={toggleConsolidationModal}
                  type="button"
                  className="text-black bg-white hover:bg-gray-50 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-1.5 me-2 mb-2 focus:outline-none border-solid border-2"
                >
                  Cancel
                </button>
                <button
                  onClick={(type === "Union") ? handleUnionNext : handleSave}
                  type="button"
                  className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
                >
                  {type === "Union" ? "Next" : "Save"}
                </button>
 
              </div>
            )}
          </div>
 
        </div>
      </Modal>
      <Modal
        open={isModalOpen}
        onClose={() => toggleModal(false)}
        BackdropProps={{
          style: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 md:w-1/3 lg:w-[22%]">
          <Columns
            id={"Union"}
            columnName={selectedColumn}
            // dataType={finalPayload?.columnsDataType?.find(col => col.name === selectedColumn)?.type}
            dataType={
              Array.isArray(finalPayload?.columnsDataType) && finalPayload.columnsDataType.length > 0
                ? finalPayload.columnsDataType.find(col => col.name === selectedColumn)?.type || "unknown"
                : "unknown"
            }
 
            toggleModal={toggleModal}
          />
 
        </div>
      </Modal>
 
      <Modal open={isUnionModalOpen} onClose={() => setIsUnionModalOpen(false)}>
        <div className="max-w-[600px] max-h-[80vh] min-h-[30vh] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 pt-4 pb-2 rounded-3xl shadow-2xl w-full border border-gray-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Column Mappings</h2>
            <button onClick={() => setIsUnionModalOpen(false)} className="text-gray-500">
              <X size={24} />
            </button>
          </div>
 
          <div className="border border-gray-300 p-4 bg-gray-50 max-h-[40vh] overflow-y-auto custom-scroll">
            {firstView && secondView && finalPayload?.union_fields?.[firstView] && finalPayload?.union_fields?.[secondView] ? (
              finalPayload.union_fields[firstView].map((col) => (
                <div key={col} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  {/* Left Side - First View Columns */}
                  {/* <select
              className="w-5/12 border border-gray-300 rounded-lg px-4 py-2 bg-white transition shadow-md text-gray-700 font-medium"
              value={col}
              disabled
            >
              <option value={col}>{col}</option>
            </select> */}
                  <input
                    type="text"
                    className="w-5/12 border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500 transition shadow-md font-medium"
                    value={col}
                    disabled
                  />
 
 
 
                  <MoveHorizontal className="w-6 h-4" />
 
                  {/* <select
                    className="w-5/12 border border-gray-300 rounded-lg px-4 py-2 bg-white transition shadow-md text-gray-700 font-medium"
                    value={mapping[col] || ""}
                    onChange={(e) => handleMappingChange(col, e.target.value)}
                  >
                    <option value="">Select column</option>
                    {finalPayload.union_fields[secondView].map((targetCol) => (
                      <option key={targetCol} value={targetCol}>
                        {targetCol}
                      </option>
                    ))}
                  </select> */}
                  <Autocomplete
                    options={finalPayload.union_fields[secondView]}
                    value={mapping[col] || null}
                    onChange={(event, newValue) => handleMappingChange(col, newValue)}
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" size="small" />
                    )}
                    className="w-5/12"
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">No columns available for mapping.</p>
            )}
          </div>
 
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setIsUnionModalOpen(false)}
              className="text-black bg-white hover:bg-gray-50 focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-7 py-1.5 me-2 mb-2 focus:outline-none border-solid border-2"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleMappingSave}
              className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-8 py-1.5 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
 
ConsolidationNode.propTypes = {
  id: PropTypes.string.isRequired,
};
 