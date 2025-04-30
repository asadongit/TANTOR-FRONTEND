import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {

    const [buttonColors] = useState({
    primaryColor:'bg-[#8E77BB]',
    secondaryColor:'hover:bg-[#96CF7B]',
  })

  const [defineNodeName, setDefineNodeName] = useState("");
  const handleDefineNodeName = (name) => {
    setDefineNodeName(name);
  }

  const [defineNodeDesc, setDefineNodeDesc] = useState("");
  const handleDefineNodeDesc = (desc) => {
    setDefineNodeDesc(desc);
  }

  const [ selectedTables, setSelectedTables] = useState([]);
  const handleSelectedTables = (table) => {
    setSelectedTables(table);
  }

  const [sourceConnectionName, setSourceConnectionName] = useState("");
  const handleSourceConnectionName = (conn_name) => {
    setSourceConnectionName(conn_name)
  }

  const [targetConnectionName, setTargetConnectionName] = useState("");
  const handleTargetConnectionName = (conn_name) => {
    setTargetConnectionName(conn_name)
  }

  const [sourceSchemaName, setSourceSchemaName] = useState("");
  const handleSourceSchemaName = (schema) => {
    setSourceSchemaName(schema);
  }

  const [selectedDataSet, setSelectedDataset] = useState([]);
  const handleSelectedDataSetName = (dataset_name) => {
    setSelectedDataset(dataset_name)
  }

  const [ selectedScope, setSelectedScope ] = useState("");
  const handleSelectedScopeName = (scope_name) => {
    setSelectedScope(scope_name)
  }

  const[ isVisibleFooter, setIsVisibleFooter ] = useState(false);
  const handleIsVisibleFooter = (value) => {
    setIsVisibleFooter(value)
  }

  const [ purgeNode, setPurgeNode ] = useState("");
  const handlePurgeNode = (node) => {
    setPurgeNode(node);
  }

  const [firstSourcePartitionName, setFirstSourcePartitionName] = useState("");
  const handleFirstSourcePartitionName = (name) => {
    setFirstSourcePartitionName(name)
  }

  const [ sourceSelectedTable, setSourceSelectedTable ] = useState(null);
  const handleSourceSelectedTable = (table) => {
    setSourceSelectedTable(table)
  }

  const [ sourceBulkSelectedObjects, setSourceBulkSelectedObjects] = useState([]);
  const handleSourceBulkSelectedObjects = (table) => {
    setSourceBulkSelectedObjects(table)
  }

  return (
    <StateContext.Provider
      value={{
        buttonColors,
        selectedTables,
        handleSelectedTables,
        sourceBulkSelectedObjects,
        handleSourceBulkSelectedObjects,
        sourceConnectionName,
        handleSourceConnectionName,
        targetConnectionName,
        handleTargetConnectionName,
        sourceSchemaName,
        handleSourceSchemaName,
        selectedDataSet,
        handleSelectedDataSetName,
        selectedScope,
        handleSelectedScopeName,
        isVisibleFooter,
        handleIsVisibleFooter,
        defineNodeDesc,
        handleDefineNodeDesc,
        defineNodeName,
        handleDefineNodeName,
        purgeNode,
        handlePurgeNode,
        firstSourcePartitionName,
        handleFirstSourcePartitionName,
        sourceSelectedTable,
        handleSourceSelectedTable
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

// ContextProvider.propTypes = {
//   children : PropTypes.func.isRequired,
// }

export const useStateContext = () => useContext(StateContext);
