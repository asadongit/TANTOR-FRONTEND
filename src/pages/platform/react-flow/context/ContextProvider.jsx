import { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {

    const [buttonColors] = useState({
    primaryColor:'bg-[#8E77BB]',
    secondaryColor:'hover:bg-[#96CF7B]',
  })

  const [ selectedTables, setSelectedTables] = useState([]);
  const handleSelectedTables = (table) => {
    setSelectedTables(table);
  }

  const [sourceConnectionName, setSourceConnectionName] = useState("");
  const handleSourceConnectionName = (conn_name) => {
    setSourceConnectionName(conn_name)
  }

  return (
    <StateContext.Provider
      value={{
        buttonColors,
        selectedTables,
        handleSelectedTables,
        sourceConnectionName,
        handleSourceConnectionName
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
