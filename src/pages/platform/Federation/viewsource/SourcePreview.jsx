import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const SourcePreview = ({ sampleData, setShowPreview, toggleModal }) => {
  return (
    <div className="h-[60%] overflow-auto">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg p-4">
        <table className="w-full text-sm text-left rtl:text-right text-black">
          <thead className="text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white ">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Connection
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Schema
              </th>
              <th scope="col" className="px-6 py-3">
                Tables
              </th>
              <th scope="col" className="px-6 py-3">
                Views
              </th>
              <th scope="col" className="px-6 py-3">
                Created
              </th>
              <th scope="col" className="px-6 py-3"></th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((data, index) => (
              <tr key={index} className="border-b dark:border-white-700">
                <th scope="row" className="px-6 py-4 font-medium text-black-900 whitespace-nowrap dark:text-black">
                  {data.id}
                </th>
                <td className="px-6 py-4">{data.connections}</td>
                <td className="px-6 py-4">{data.description}</td>
                <td className="px-6 py-4">{data.schema}</td>
                <td className="px-6 py-4">{data.tables}</td>
                <td className="px-6 py-4">{data.views}</td>
                <td className="px-6 py-4">{data.created}</td>
                <td className="px-6 py-4">
                  <Pencil className="h-5 w-5" />
                </td>
                <td className="px-6 py-4">
                  <Trash2 className="h-5 w-5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-4 border-t p-4">
        <button onClick={() => setShowPreview(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={toggleModal} className="px-4 py-2 bg-[#8E77BB] text-white rounded-lg hover:bg-[rgb(142,119,187,0.8)]">
          Create a View
        </button>
      </div>
    </div>
  );
};

export default SourcePreview;