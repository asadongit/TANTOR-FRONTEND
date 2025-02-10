import React, { createContext, useContext, useState, useEffect } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {
    const [viewPayload, setViewPayload] = useState([]);
    const handleViewPayload = (val) => {
      setViewPayload(val);
    }

    const [connectionPayload, setConnectionPayload] = useState([]);
    const handleConnectionPayload = (val) => {
      setConnectionPayload(val);
    }

    const [consolidationPayload, setConsolidationPayload] = useState([]);
    const handleConsolidationPayload = (val) => {
        setConsolidationPayload((prevPayload) => {
          return [
            ...prevPayload, 
            val, 
          ];
        });
      };


      const [finalPayload, setFinalPayload] = useState({});
      const handleFinalPayload = (val) => {
        setFinalPayload(val);
      };

      const [columnSettings, setColumnSettings] = useState({});

       // Source View States
       const [settingsPayload, setSettingsPayload] = useState(new Map());
       
       const [userSelections, setUserSelections] = useState(new Map());
       const [settingsList, setSettingsList] = useState([]);
       
       useEffect(() => {
        console.log("Settings list change ==> ",settingsList);
        console.log("User Selections ==> ",userSelections);

       }, [settingsList,userSelections])
    return (
        <StateContext.Provider
          value={{
            viewPayload,
            handleViewPayload,
            consolidationPayload,
            handleConsolidationPayload,
            connectionPayload,
            handleConnectionPayload,
            finalPayload,
            handleFinalPayload,
            columnSettings,
            setColumnSettings,
            settingsPayload, setSettingsPayload,
            settingsList, setSettingsList,
            userSelections, setUserSelections
          }}
        >
          {children}
        </StateContext.Provider>
      );
    };
    
    export const useStateContext = () => useContext(StateContext);