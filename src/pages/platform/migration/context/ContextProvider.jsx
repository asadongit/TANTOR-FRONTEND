import React, { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {

    const [buttonColors] = useState({
    primaryColor:'bg-[#8E77BB]',
    secondaryColor:'hover:bg-[#96CF7B]',
  })

  return (
    <StateContext.Provider
      value={{
        buttonColors
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
