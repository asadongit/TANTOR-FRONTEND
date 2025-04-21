import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ChevronDown } from 'lucide-react';

const ReportDownloader = ({ data }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const convertToCSV = (jsonData) => {
    const headers = Object.keys(jsonData[0]).join(',');
    
    const csvRows = jsonData.map(obj => 
      Object.values(obj).map(val => 
        `"${val}"`
      ).join(',')
    );

    return [headers, ...csvRows].join('\n');
  };

  const downloadCSV = () => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDropdownOpen(false);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center px-4 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
      >
        Download Report
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 right-0 mt-2 w-40 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div
              onClick={downloadCSV}
              className="block cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Download CSV
            </div>
            <div
              onClick={downloadExcel}
              className="block cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Download Excel
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDownloader;