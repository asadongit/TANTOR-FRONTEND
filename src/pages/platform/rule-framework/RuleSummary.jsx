import React, { useState } from "react";
import { X, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useStateContext } from "../Federation/context/contextViewProvider";
import { Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";

const RuleSummary = ({ setIsOpen, selectedFact, tables, filterData, previewData }) => {
  const { finalPayload } = useStateContext();
  const navigate = useNavigate();
  console.log(`RuleSummary ==== FinalPayload => `, finalPayload);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedColumn, setEditedColumn] = useState(null);

  const columns = filterData?.columns || [];
  const currentColumn = columns[currentColumnIndex] || {
    name: "total_outstanding_amt",
    type: "varchar",
    alias: "",
    output: true,
    order: "1",
    sort: "ASC",
    aggregate: "SUM",
    groupBy: false,
    isVisible: true
  };

  const handleNextColumn = () => {
    if (currentColumnIndex < columns.length - 1) {
      setCurrentColumnIndex(currentColumnIndex + 1);
      setEditMode(false);
      setEditedColumn(null);
    }
  };
  
  const handlePrevColumn = () => {
    if (currentColumnIndex > 0) {
      setCurrentColumnIndex(currentColumnIndex - 1);
      setEditMode(false);
      setEditedColumn(null);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditedColumn({ ...currentColumn });
  };

  const handleSave = () => {
    if (editedColumn) {
      const updatedColumns = [...columns];
      updatedColumns[currentColumnIndex] = editedColumn;
      filterData.columns = updatedColumns;
      setEditMode(false);
      setEditedColumn(null);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedColumn(null);
  };

  const handleColumnChange = (field, value) => {
    if (editedColumn) {
      setEditedColumn({
        ...editedColumn,
        [field]: value
      });
    }
  };

  return (
    <Modal
      open={true}
      onClose={() => setIsOpen(false)}
      aria-labelledby="rule-summary-modal"
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[90%] max-w-6xl h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Section - Main Content */}
          <div className="flex-1 flex flex-col h-full border-r border-gray-200">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header with navigation path */}
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Platform</span>
                  <span>→</span>
                  <span>Rule</span>
                  <span>→</span>
                  <span>Create Rule</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-semibold mb-6">Summary</h2>

              {/* Main Content Grid */}
              <div className="space-y-6">
                {/* Name and Description */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">{finalPayload?.name || "Not defined"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-gray-600">{finalPayload?.description || "No description"}</span>
                    </div>
                  </div>
                </div>

                {/* Table and Column */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">{selectedFact?.fct_name || "fct_loans"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Column</label>
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <span className="text-blue-600">
                        {tables?.map((t) => t.name || t.matric_name).join(", ") || currentColumn.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <span className="text-gray-600">
                      {filterData?.sqlPreview || "(total_outstanding_amt = '2')"}
                    </span>
                  </div>
                </div>

                {/* Query Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Query Preview</label>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <pre className="text-sm font-mono text-blue-600 whitespace-pre-wrap">
                      {previewData}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  Save Draft
                </button>
                <button 
                  onClick={() => navigate('/config/rule')}
                  className="px-4 py-2 bg-[#8e78b7] text-white rounded-md hover:bg-[#7b65a3] transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Column Settings */}
          <div className="w-[400px] overflow-y-auto p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Column Settings</h3>
              {/* <button className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button> */}
            </div>

            <div className="space-y-6">
              {/* Navigation Arrows */}
              <div className="flex justify-between items-center bg-white p-3 rounded-md border border-gray-200">
                <button
                  onClick={handlePrevColumn}
                  disabled={currentColumnIndex === 0}
                  className={`text-lg ${currentColumnIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <ArrowBigLeft />
                </button>
                <span className="text-sm font-medium">
                  Column {currentColumnIndex + 1} of {columns.length}: {editMode ? editedColumn.name : currentColumn.name}
                </span>
                <button
                  onClick={handleNextColumn}
                  disabled={currentColumnIndex === columns.length - 1}
                  className={`text-lg ${currentColumnIndex === columns.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <ArrowBigRight />
                </button>
              </div>

              {/* Column Properties */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">{editMode ? editedColumn.name : currentColumn.name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <span className="text-gray-900">{editMode ? editedColumn.type : currentColumn.type}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alias</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedColumn.alias || ""}
                      onChange={(e) => handleColumnChange('alias', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.alias || "-"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
                  {editMode ? (
                    <select
                      value={editedColumn.output ? "Yes" : "No"}
                      onChange={(e) => handleColumnChange('output', e.target.value === "Yes")}
                      className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.output ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedColumn.order || ""}
                      onChange={(e) => handleColumnChange('order', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.order || "-"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
                  {editMode ? (
                    <select
                      value={editedColumn.sort || ""}
                      onChange={(e) => handleColumnChange('sort', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    >
                      <option value="">None</option>
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </select>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.sort || "-"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aggregate</label>
                  {editMode ? (
                    <select
                      value={editedColumn.aggregate || ""}
                      onChange={(e) => handleColumnChange('aggregate', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8e78b7]"
                    >
                      <option value="">None</option>
                      <option value="SUM">SUM</option>
                      <option value="AVG">AVG</option>
                      <option value="COUNT">COUNT</option>
                      <option value="MIN">MIN</option>
                      <option value="MAX">MAX</option>
                    </select>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.aggregate || "-"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                  {editMode ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedColumn.groupBy}
                        onChange={(e) => handleColumnChange('groupBy', e.target.checked)}
                        className="h-4 w-4 text-[#8e78b7] border-gray-300 rounded focus:ring-[#8e78b7]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable group by for this column</span>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <span className="text-gray-900">{currentColumn.groupBy ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-[#8e78b7] text-white rounded-md hover:bg-[#7b65a3] transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RuleSummary;