import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// Curated column map: only business-relevant fields with friendly labels.
// Technical/internal fields (condition, report_id, created_at, updated_at, etc.) are excluded.
const REPORT_COLUMNS = [
  { key: 'workflow_name',              label: 'Name'                        },
  { key: 'workflow_type',              label: 'Report For'                  },
  { key: 'execute_type',               label: 'Type'                        },
  { key: 'project',                    label: 'Project'                     },
  { key: 'created_by',                 label: 'Users'                       },
  { key: 'start_time',                 label: 'Start Date'                  },
  { key: 'end_time',                   label: 'End Date'                    },
  { key: 'before_source_table_count',  label: 'Before Source Table Count'   },
  { key: 'after_target_table_count',   label: 'After Target Table Count'    },
  { key: 'table_size_before',          label: 'Table Size Before'           },
  { key: 'table_size_after',           label: 'Table Size After'            },
  { key: 'status_choices',             label: 'Status'                      },
  { key: 'remarks',                    label: 'Remark'                      },
];

// Format a cell value: date fields are trimmed to YYYY-MM-DD, nulls become empty string.
const formatValue = (key, val) => {
  if (val === null || val === undefined) return '';
  if (key === 'start_time' || key === 'end_time') {
    return String(val).split('T')[0];
  }
  return val;
};

// Transform raw API data into clean, labelled rows for export.
const buildExportRows = (rawData) =>
  rawData.map((row) => {
    const cleanRow = {};
    REPORT_COLUMNS.forEach(({ key, label }) => {
      cleanRow[label] = formatValue(key, row[key]);
    });
    return cleanRow;
  });

const ReportDownloader = ({ data }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const downloadCSV = () => {
    const rows = buildExportRows(data);
    const headers = REPORT_COLUMNS.map((c) => c.label);
    const csvRows = rows.map((row) =>
      headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...csvRows].join('\n');

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
    toast.success('Preparing to download...');
  };

  const downloadExcel = () => {
    const rows = buildExportRows(data);
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: REPORT_COLUMNS.map((c) => c.label),
    });

    // Set column widths for better readability
    worksheet['!cols'] = REPORT_COLUMNS.map(({ label }) => ({
      wch: Math.max(label.length + 4, 16),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    toast.success('Preparing to download...');
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