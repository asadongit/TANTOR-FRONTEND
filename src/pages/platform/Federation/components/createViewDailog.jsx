/*eslint-disable*/
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../context/contextProvider";

const CreateViewDialog = ({ isModalOpen, toggleModal, modalState, setModalState }) => {

  const { complexCheck, setComplexCheck} = useStateContext("")
  
  const navigate = useNavigate();

  const handleCreateView = () => {
    if (modalState.viewType === "Source" && (modalState.queryType === "Regular" || modalState.queryType === "Complex")) {
      navigate("/federation/view/source", {
        state: modalState,
      });
    }
    if (modalState.viewType === "Business" && (modalState.queryType === "Regular" || modalState.queryType === "Complex")) {

      if(modalState.queryType === "Complex"){
        setComplexCheck(true)
      }
      else{
        setComplexCheck(false)
      }

      navigate("/viewcanvas", {
        state: modalState,
      });
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8E77BB] text-2xl font-bold">Create a View</h2>
          <button onClick={toggleModal} className="text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <div>
          {/* Query Type */}
          <div className="mb-4">
            <label className="block text-[#282F49] text-lg font-semibold">
              Select Query Type
            </label>
            <div className="flex mt-2">
              <button
                onClick={() => setModalState({ ...modalState, queryType: "Regular" })}
                className={`w-[7rem] h-[2.5rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  modalState.queryType === "Regular"
                    ? "border-[#8E77BB] text-[#8E77BB]"
                    : "border-transparent text-gray-700"
                }`}
              >
                Regular
              </button>
              <button
                onClick={() => setModalState({ ...modalState, queryType: "Complex" })}
                className={`w-[7rem] h-[2.5rem] py-1.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  modalState.queryType === "Complex"
                    ? "border-[#8E77BB] text-[#8E77BB]"
                    : "border-transparent text-gray-700"
                }`}
              >
                Complex
              </button>
            </div>
          </div>

          {/* View Type */}
          <div className="mb-6">
            <label className="block text-[#282F49] text-lg font-semibold">
              Select View Type
            </label>
            <div className="flex gap-4 mt-4">
              <div
                onClick={() => setModalState({ ...modalState, viewType: "Source" })}
                className={`w-full sm:w-[16rem] h-16 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${
                  modalState.viewType === "Source"
                    ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Source View
              </div>
              <div
                onClick={() => setModalState({ ...modalState, viewType: "Business" })}
                className={`w-full sm:w-[16rem] h-16 p-3 border rounded-md transition-all duration-300 flex items-center justify-center ${
                  modalState.viewType === "Business"
                    ? "border-[#8E77BB] text-[#8E77BB] bg-[#F3F2F9]"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Business View
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateView}
            className="w-full bg-[#8E77BB] text-white py-2 rounded-lg"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateViewDialog;
