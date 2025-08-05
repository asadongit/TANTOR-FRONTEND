import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import { useAuth } from '../../../../../../context/AuthContext.jsx';
import { ToastContainer, toast } from 'react-toastify';

const DataDisplayModal = ({ data, onClose }) => {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cleaned Data</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-x-auto flex-1 mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  {headers.map(header => (
                    <td
                      key={`${index}-${header}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {row[header]?.toString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const cleaningOptions = [
  { id: 'remove_duplicates', label: 'Remove Duplicate Rows' },
  { id: 'drop_constant', label: 'Drop Constant Columns' },
  { id: 'remove_outliers', label: 'Drop Outliers' },
  { id: 'correlation', label: 'Remove Correlated Features' },
  { id: 'missing_value', label: 'Handle Missing Values', expandable: true },
  { id: 'missing_dates', label: 'Handle Missing Dates' },
  { id: 'missing_categorical', label: 'Handle Missing Categorical', expandable: true },
  { id: 'binning', label: 'Perform Binning', expandable: true },
  { id: 'change_datatypes', label: 'Change Datatypes', expandable: true },
  { id: 'normalization', label: 'Numerical Normalisation', expandable: true },
  { id: 'skewness', label: 'Skewness', expandable: true },
];

export const initialFormData = {
  flag: 'false',
  missing_values_strategy: 'mean',
  datetime_col: '',
  missing_categorical_strategy: 'mode',
  bin_column_name: '',
  bin_values: '',
  datatype_conversion: '',
  normalization_strategy: 'minmax',
  numerical_cols: [],
  skewness_strategy: 'boxcox',
  operations: [],
};


function Cleaning({ query, formData, setFormData }) {
  const { token, hostnameV1, decodedToken } = useAuth();
  // const [formData, setFormData] = useState(initialFormData);
  const [showModal, setShowModal] = useState(false);
  const [cleanedData, setCleanedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [normalisationColumns, setNormalisationColumns] = useState([]);
  const [columns, setColumns] = useState([]);
  const [showDisplayButton, setShowDisplayButton] = useState(false);

  useEffect(() => {
    const fetchColumns = async () => {
      const formData = new FormData();
      formData.append('given_query', query);

      try {
        const response = await fetch(`${hostnameV1}/get_columns`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch columns');
        }

        const data = await response.json();
        setNormalisationColumns(data.numerical_columns || [])
        setColumns(data.all_columns || [])
      } catch (error) {
        toast.error('Failed to fetch columns');
      }
    };

    if (query) {
      fetchColumns()
    }

  }, [query]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowDisplayButton(false);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataObj.append(key, value.join(','));
        } else {
          formDataObj.append(key, value);
        }
      });
      formDataObj.append('given_query', query);

      const response = await fetch(`${hostnameV1}/cleaning`, {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setCleanedData(data.cleaned_df);
        setShowDisplayButton(true);
        toast.success('Data cleaned successfully!');
      } else {
        toast.error(data.message || 'Failed to fetch cleaned data');
      }

    } catch (error) {
      toast.error('Failed to fetch cleaned data');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setCleanedData([]);
    setShowDisplayButton(false);
    setOpenSection(null);
    setShowModal(false);
  };

  const handleToggleAccordion = (sectionName) => {
    setOpenSection(prevOpenSection => (prevOpenSection === sectionName ? null : sectionName));
  };

  const handleCheckboxChange = (operation) => {
    const isCurrentlyChecked = formData.operations.includes(operation);

    const isExpandable = cleaningOptions.find(opt => opt.id === operation)?.expandable;
    if (isExpandable) {
      setOpenSection(isCurrentlyChecked ? null : operation);
    }

    setFormData(prev => {
      const newOperations = isCurrentlyChecked
        ? prev.operations.filter(op => op !== operation)
        : [...prev.operations, operation];
      return { ...prev, operations: newOperations };
    });

    setShowDisplayButton(false);
  };

  const renderExpandableContent = (optionId) => {
    switch (optionId) {
      case 'missing_value':
        return (
          <div className="mt-2 ml-6 w-3/4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Strategy</label>
            <select name="missing_values_strategy" value={formData.missing_values_strategy} onChange={handleInputChange} className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="mean">Mean</option>
              <option value="median">Median</option>
              <option value="mode">Mode</option>
              <option value="linear_regression">Linear Regression</option>
              <option value="knn">KNN</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        );
      case 'missing_categorical':
        return (
          <div className="mt-2 ml-6 w-3/4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Strategy</label>
            <select name="missing_categorical_strategy" value={formData.missing_categorical_strategy} onChange={handleInputChange} className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="mode">Mode</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        );
      case 'binning':
        return (
          <div className="mt-2 ml-6 w-3/4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
              <select name="bin_column_name" value={formData.bin_column_name} onChange={handleInputChange} className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select column</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bin Values (comma separated)</label>
              <input type="text" name="bin_values" value={formData.bin_values} onChange={handleInputChange} placeholder="e.g. 100,105,110,115,120" className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        );
      case 'change_datatypes':
        return (
          <div className="mt-2 ml-6 w-3/4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
              <select name="datatype_conversion_column" value={formData.datatype_conversion.split(':')[0] || ''} onChange={(e) => { const type = formData.datatype_conversion.split(':')[1] || 'int'; setFormData(prev => ({ ...prev, datatype_conversion: `${e.target.value}:${type}` })); }} className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select column</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Datatype</label>
              <select
                name="datatype_conversion_type"
                value={formData.datatype_conversion.split(':')[1] || 'int'}
                onChange={(e) => {
                  const col = formData.datatype_conversion.split(':')[0] || '';
                  setFormData(prev => ({ ...prev, datatype_conversion: `${col}:${e.target.value}` }));
                }}
                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="int">Integer</option>
                <option value="float">Float</option>
                <option value="str">String</option>
                <option value="bool">Boolean</option>
                <option value="datetime">Datetime</option>
              </select>
            </div>
          </div>
        );
      case 'normalization': {
        const selectOptions = normalisationColumns.map(col => ({
          value: col,
          label: col,
        }));
        const handleMultiSelectChange = (selectedOptions) => {
          const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
          setFormData(prev => ({
            ...prev,
            numerical_cols: selectedValues,
          }));
        };
        const selectedValues = selectOptions.filter(option =>
          formData.numerical_cols.includes(option.value)
        );
        return (
          <div className="mt-2 ml-6 w-3/4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Numerical Columns
              </label>
              <Select
                isMulti
                name="numerical_cols"
                options={selectOptions}
                value={selectedValues}
                onChange={handleMultiSelectChange}
                className="text-xs"
                classNamePrefix="select"
                placeholder="Select columns..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Strategy</label>
              <select
                name="normalization_strategy"
                value={formData.normalization_strategy}
                onChange={handleInputChange}
                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="minmax">Min-Max</option>
                <option value="standard">Z-Score</option>
              </select>
            </div>
          </div>
        );
      }
      case 'skewness':
        return (
          <div className="mt-2 ml-6 w-3/4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Strategy</label>
            <select name="skewness_strategy" value={formData.skewness_strategy} onChange={handleInputChange} className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="boxcox">Boxcox</option>
              <option value="log-transformation">Log Transformation</option>
              <option value="square-root-transformation">Square root transformation</option>
              <option value="yeo-johnson">Yeo-Johnson</option>
              <option value="exponential-transformation">Exponential Transformation</option>
              <option value="rank">Rank</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  }


  const column1Options = cleaningOptions.filter((_, index) => index % 2 === 0);
  const column2Options = cleaningOptions.filter((_, index) => index % 2 !== 0);

  return (
    <div className="container w-full p-4 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
        <div className="flex flex-col md:flex-row w-full md:space-x-3">
          <div className="flex-1 flex flex-col space-y-3">
            {column1Options.map(option => (
              <div key={option.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div
                  className={`flex items-center justify-between ${option.expandable ? 'cursor-pointer' : ''}`}
                  onClick={() => option.expandable && handleToggleAccordion(option.id)}
                >
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.operations.includes(option.id)}
                      onChange={() => handleCheckboxChange(option.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 select-none">{option.label}</span>
                  </label>
                  {option.expandable && (
                    openSection === option.id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                {option.expandable && openSection === option.id && renderExpandableContent(option.id)}
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col space-y-3 mt-3 md:mt-0">
            {column2Options.map(option => (
              <div key={option.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div
                  className={`flex items-center justify-between ${option.expandable ? 'cursor-pointer' : ''}`}
                  onClick={() => option.expandable && handleToggleAccordion(option.id)}
                >
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.operations.includes(option.id)}
                      onChange={() => handleCheckboxChange(option.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 select-none">{option.label}</span>
                  </label>
                  {option.expandable && (
                    openSection === option.id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                {option.expandable && openSection === option.id && renderExpandableContent(option.id)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full justify-end pt-1 gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-5 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
          >
            Clear
          </button>
          {!showDisplayButton && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Process'}
            </button>
          )}

          {showDisplayButton && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
            >
              Display
            </button>
          )}
          {/* <button
            type="button"
            className="flex items-center gap-2 px-5 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
          >
            Save
          </button> */}

          <button
            type="button"
            className="flex items-center gap-2 px-7 py-1.5 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7a67a0] transition-colors"
          >
            Ok
          </button>
        </div>
      </form>

      {showModal && (
        <DataDisplayModal
          data={cleanedData}
          onClose={() => setShowModal(false)}
        />
      )}
      <ToastContainer />
    </div>
  );
}

export default Cleaning;