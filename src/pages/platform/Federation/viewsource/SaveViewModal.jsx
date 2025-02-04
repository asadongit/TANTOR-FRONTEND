import React, { useState } from "react";

const SaveViewModal = ({ toggleModal, handleSaveView }) => {
  const [newViewName, setNewViewName] = useState("");

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#8E77BB] text-2xl font-bold">View Name</h2>
          <button onClick={toggleModal} className="text-gray-500 text-2xl">
            &times;
          </button>
        </div>

        <div>
          <div className="mb-6">
            <label className="block text-[#282F49] text-lg font-semibold">
              Enter View Name
            </label>
            <input
              type="text"
              value={newViewName || ""}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter View Name"
              className="w-full mt-2 p-2.5 border rounded-lg text-gray-700 border-gray-300 focus:ring-2 focus:ring-[#8E77BB] focus:outline-none"
            />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleModal();
              handleSaveView({ newViewName });
            }}
            className="w-full bg-[#8E77BB] text-white py-2 rounded-lg"
          >
            Save View
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveViewModal;