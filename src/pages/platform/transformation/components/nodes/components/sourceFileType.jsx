import React from "react";
import { Plus, X } from "lucide-react";
import { DATE_FORMATS, getFormatExample } from "../../drawer/operations/timeZoneFormatMapping";
import { featureFlags } from "../../../../../../components/FeatureFlag";

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
  const [dateFormatModalOpen, setDateFormatModalOpen] = React.useState(false);
  const [selectedColumnForFormat, setSelectedColumnForFormat] = React.useState(null);
  const [selectedFormat, setSelectedFormat] = React.useState("");
  const [customFormatInput, setCustomFormatInput] = React.useState("");

  const fileInputRef = React.useRef(null);
  const nlpTxtFile = data?.nlpTxtFile || null;

  const handleTxtUploadClick = () => fileInputRef.current?.click();

  const handleTxtFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    data?.onDataChange?.({ nlpTxtFile: file });
  };

  const handleUseData = (data) => {
    const normalizedOutputPath = data.output_json_file.replace(/\\/g, '/');
    const pathParts = normalizedOutputPath.split('/');
    const fileNameFromPath = pathParts.pop();
    const directoryPath = pathParts.join('/') + '/';

    setFilePath(directoryPath);
    const baseName = data.file_name.replace(/\.[^/.]+$/, "");
    const newFileName = baseName + ".json";
    setFileName(newFileName);
    const newColumns = data.columns.map((col, idx) => ({
      id: Date.now() + idx,
      name: col,
      datatype: 'string',
      format: '',
      customDatatype: ''
    }));
    setFileColumns(newColumns);
    data?.onDataChange?.({
      filePath: directoryPath,
      fileName: newFileName,
      fileColumns: newColumns
    });
    dispatch({
      type: ACTION_TYPES.UPDATE_SOURCE,
      payload: {
        id: id,
        data: {
          filePath: directoryPath,
          fileName: newFileName,
          fileColumns: newColumns
        }
      }
    });
    window.allNodesLastUpdate = Date.now();
    if (window.triggerSidebarUpdate) {
      window.triggerSidebarUpdate();
    }
  };

  const handleOpenNlp = () => {
    window.onUseData = handleUseData;
    window.openUnstructuredDataPrepModal?.({ file: nlpTxtFile });
  };

  const handleDatatypeChange = (columnId, value) => {
    updateFileColumn(columnId, 'datatype', value);
    if (['date', 'datetime', 'timestamp'].includes(value)) {
      const column = fileColumns.find(col => col.id === columnId);
      const existingFormat = column?.format || "";
      const isPredefined = DATE_FORMATS.some(df => df.format === existingFormat);
      if (isPredefined) {
        setSelectedFormat(existingFormat);
        setCustomFormatInput("");
      } else {
        setSelectedFormat("custom");
        setCustomFormatInput(existingFormat);
      }
      setSelectedColumnForFormat(columnId);
      setDateFormatModalOpen(true);
    }
  };

  const handleFormatSave = () => {
    if (selectedColumnForFormat) {
      const formatToSave = selectedFormat === "custom" ? customFormatInput : selectedFormat;
      updateFileColumn(selectedColumnForFormat, 'format', formatToSave);
    }
    setDateFormatModalOpen(false);
    setSelectedColumnForFormat(null);
    setSelectedFormat("");
    setCustomFormatInput("");
  };

  const handleFormatCancel = () => {
    setDateFormatModalOpen(false);
    setSelectedColumnForFormat(null);
    setSelectedFormat("");
    setCustomFormatInput("");
  };

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

              {featureFlags.SHOW_UNSTRUCTURED_IN_ETL && (
                <div
                  className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${fileType === "JSON" ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    setFileType("JSON");
                    setFileTypeDropdownOpen(false);
                  }}
                >
                  JSON
                </div>
              )}

              {featureFlags.SHOW_UNSTRUCTURED_IN_ETL && (
                <div
                  className={`p-2 text-[11px] text-black cursor-pointer hover:bg-gray-100 ${fileType === "XML" ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    setFileType("XML");
                    setFileTypeDropdownOpen(false);
                  }}
                >
                  XML
                </div>
              )}


            </div>
          )}
        </div>
      </div>

      {(fileType === "JSON" || fileType === 'XML') && (
        <div className="mb-2">
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Upload File
          </label>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain,.json,.xml"
              className="hidden"
              onChange={handleTxtFileChange}
            />

            <button
              type="button"
              onClick={handleTxtUploadClick}
              className="px-2 py-1.5 text-[11px] bg-[#8E77BB] text-white rounded-sm hover:bg-[#7A6BA3] focus:outline-none"
            >
              Upload
            </button>

            {nlpTxtFile && (
              <button
                type="button"
                onClick={handleOpenNlp}
                className="px-2 py-1.5 text-[11px] bg-white text-[#8E77BB] border border-[#8E77BB] rounded-sm hover:bg-gray-50 focus:outline-none"
              >
                Data Preparation
              </button>
            )}
          </div>

          {nlpTxtFile && (
            <div className="mt-1 text-[10px] text-gray-600 truncate">
              {nlpTxtFile.name}
            </div>
          )}
        </div>
      )}

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
                onChange={e => handleDatatypeChange(column.id, e.target.value)}
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

      {dateFormatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-4 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-black">
                Select Date Format
              </h3>
              <button
                onClick={handleFormatCancel}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-black mb-1 block">
                  Choose a date format:
                </label>
                <select
                  className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                  value={selectedFormat}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedFormat(value);
                    if (value !== "custom") {
                      setCustomFormatInput("");
                    }
                  }}
                >
                  <option value="">Select format</option>
                  {DATE_FORMATS.map((df) => (
                    <option key={df.format} value={df.format}>
                      {df.format} - {df.example}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
              {selectedFormat === "custom" && (
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">
                    Enter custom date format:
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 text-sm bg-white rounded border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
                    value={customFormatInput}
                    onChange={(e) => setCustomFormatInput(e.target.value)}
                    placeholder="e.g., yyyy-MM-dd HH:mm:ss"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleFormatCancel}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFormatSave}
                className={`px-3 py-1.5 text-sm rounded focus:outline-none focus:ring-2 ${(selectedFormat === "custom" ? customFormatInput.trim() !== "" : selectedFormat.trim() !== "")
                  ? "bg-[#8E77BB] text-white hover:bg-[#7A6BA3] focus:ring-[#8E77BB]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                disabled={selectedFormat === "custom" ? customFormatInput.trim() === "" : selectedFormat.trim() === ""}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};