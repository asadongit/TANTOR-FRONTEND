import React from "react";

const SourcePreview = ({ previewData, setPreviewData, setShowPreview, toggleModal }) => {
  const tableColumnNames = Object.keys(previewData[0]);

  return (
    <div className="relative h-[60%] flex flex-col">
      <div className="p-4 pb-2 sticky top-0 bg-white z-10">
        <p className="text-lg font-semibold mb-0">Output Preview</p>
      </div>

      <div className="flex-1 overflow-auto p-3 pt-0">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm text-left rtl:text-right text-black">
              <thead className="sticky top-0 text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white z-20">
                <tr>
                  {tableColumnNames.map((columnName, index) => (
                    <th key={index} scope="col" className="px-4 py-2 ">{columnName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((data, index) => (
                  <tr key={index} className="border-b dark:border-white-700">
                    {tableColumnNames.map((columnName, index) => (
                      <td key={index} className="px-4 py-2">{data[columnName]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t shadow-lg flex justify-end gap-4">
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
