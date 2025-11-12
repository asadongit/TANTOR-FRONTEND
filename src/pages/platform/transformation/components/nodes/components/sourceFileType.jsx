import React from "react";
import { Plus, X } from "lucide-react";

export const SourceFileType = ({
  fileType,
  setFileType,
  filePath,
  setFilePath,
  fileName,
  setFileName,
  fileColumns,
  setFileColumns,
  alias,
  setAlias,
  enableCountLogging,
  setEnableCountLogging,
  fileTypeDropdownOpen,
  setFileTypeDropdownOpen,
  fileTypeDropdownRef,
  addFileColumn,
  removeFileColumn,
  updateFileColumn,
  id,
  data,
  dispatch,
  ACTION_TYPES,
}) => {
  return (
    <>
      <div>
        <label className="text-xs font-semibold text-black mb-0.5 block">
          File Type
        </label>
        <div className="relative" ref={fileTypeDropdownRef}>
          <button
            type="button"
            className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800 text-left flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-8"
            onClick={() => setFileTypeDropdownOpen(v => !v)}
          >
            {fileType}
            <span className="ml-auto pl-2">&#9662;</span>
          </button>
          {fileTypeDropdownOpen && (
            <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1">
              <div
                className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${fileType === "CSV" ? "bg-gray-100" : ""}`}
                onClick={() => {
                  setFileType("CSV");
                  setFileTypeDropdownOpen(false);
                }}
              >
                CSV
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-black mb-0.5 block">
          File Path
        </label>
        <input
          type="text"
          className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
          value={filePath}
          onChange={e => setFilePath(e.target.value)}
          placeholder="Enter file path"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-black mb-0.5 block">
          File Name
        </label>
        <input
          type="text"
          className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="Enter file name"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-black">
            Column Mapping
          </label>
          <button
            type="button"
            onClick={addFileColumn}
            className="flex items-center justify-center w-4 h-4 bg-[#8E77BB] text-white rounded-full hover:bg-[#7A6BA3] focus:outline-none"
            title="Add column"
          >
            <Plus size={10} />
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-sm p-2">
          {fileColumns.map((column) => (
            <div key={column.id} className="flex gap-2 items-center">
              <input
                type="text"
                className="flex-1 p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                value={column.name}
                onChange={e => updateFileColumn(column.id, 'name', e.target.value)}
                placeholder="Column name"
              />
              <select
                className="flex-1 p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
                value={column.datatype === 'custom' ? (column.customDatatype || 'custom') : column.datatype}
                onChange={e => updateFileColumn(column.id, 'datatype', e.target.value)}
              >
                <option value="string">string</option>
                <option value="integer">integer</option>
                <option value="float">float</option>
                <option value="boolean">boolean</option>
                <option value="date">date</option>
                <option value="datetime">datetime</option>
                <option value="timestamp">timestamp</option>

                <option value="custom">custom</option>
                {column.datatype === 'custom' && column.customDatatype && (
                  <option value={column.customDatatype}>{column.customDatatype}</option>
                )}
              </select>
              {fileColumns.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFileColumn(column.id)}
                  className="flex items-center justify-center w-6 h-6 text-red-500 hover:text-red-700 focus:outline-none"
                  title="Remove column"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {fileName && (
        <div className="mt-2">
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Alias Name
          </label>
          <input
            type="text"
            className="w-full p-1.5 text-[11px] bg-white rounded-sm border border-gray-300 text-gray-800"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Enter alias name"
          />
        </div>
      )}

      {fileName && (
        <div className="mt-2">
          <label className="flex items-center text-xs font-semibold text-black">
            <input
              type="checkbox"
              className="mr-1.5 h-3.5 w-3.5"
              checked={enableCountLogging}
              onChange={(e) => {
                const newValue = e.target.checked;
                setEnableCountLogging(newValue);
                if (data.onDataChange) {
                  data.onDataChange({ enableCountLogging: newValue });
                }
                if (window.allNodes) {
                  const nodeIndex = window.allNodes.findIndex(n => n.id === id);
                  if (nodeIndex !== -1) {
                    window.allNodes[nodeIndex].data.enableCountLogging = newValue;
                  }
                }
                dispatch({
                  type: ACTION_TYPES.UPDATE_SOURCE,
                  payload: {
                    id: id,
                    data: { enableCountLogging: newValue }
                  }
                });
                window.allNodesLastUpdate = Date.now();
                if (window.triggerSidebarUpdate) {
                  window.triggerSidebarUpdate();
                }
              }}
            />
            <span>Enable Count Logging</span>
          </label>
        </div>
      )}
    </>
  );
};