import React from "react";

const SourcePreview = ({ previewData, setPreviewData, setShowPreview, toggleModal }) => {
  const tableColumnNames = Object.keys(previewData[0]);

  return (
    <div className="fixed inset-x-0 bottom-0 h-[50vh] bg-white flex flex-col">
      <div className="p-4 pb-2 bg-white border-b">
        <p className="text-lg font-semibold mb-0">Output Preview</p>
      </div>
  
      <div className="flex-1 overflow-auto mx-1">
        <div className="relative shadow-md sm:rounded-lg mx-1">
          <table className="w-full text-sm text-left text-black">
            <thead className="sticky top-0 text-xs uppercase bg-[#282F49] text-white">
              <tr>
                {tableColumnNames.map((columnName, index) => (
                  <th key={index} scope="col" className="px-4 py-3">{columnName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {tableColumnNames.map((columnName, index) => (
                    <td key={index} className="px-4 py-2">{data[columnName]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  
      <div className="p-4 border-t shadow-lg flex justify-end gap-4 bg-white">
        <button
          onClick={() => setShowPreview(false)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={toggleModal}
          className="px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]"
        >
          Create a View
        </button>
      </div>
    </div>
  );
};

export default SourcePreview;