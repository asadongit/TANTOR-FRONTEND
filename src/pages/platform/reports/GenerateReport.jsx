import { Icon } from "@iconify-icon/react";
import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronDown,
} from "lucide-react";

const GenerateReport = () => {

    const [reportType, setReportType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortController = useRef(new AbortController());


  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false
  });

  // Function to open a specific modal
  const openModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  // Function to close a specific modal
  const closeModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: false }));
  };



  const handleGenerateReport = async () => {
    if (!reportType || !startDate || !endDate) {
      setError('Please fill all required fields');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      
      const payload = { reportType, startDate, endDate };
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.current.signal,
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Success:', data);
      closeModal("modal1");
      // Add any success handling here
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        setError(error.message || 'Failed to generate report');
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    return () => {
      abortController.current.abort();
      abortController.current = new AbortController();
    };
  }, []);


  const sampleData = [
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Failed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Failed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
      status: "Completed",
    },
  ];

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Purge",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "Migration",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "CDC",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Federation",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Transformation",
      count: "06",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold font-semibold font-[Proxima_Nova] ">
          Details
        </h1>
        <div>
          <button
            onClick={() => openModal("modal1")}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Add Project Model */}

      {isModalOpen.modal1 && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
    <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-white rounded-l-2xl flex flex-col">
      {/* Header Section */}
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon
              className="h-5 w-5 text-[#8e78b7]"
              icon={"material-symbols:tactic-rounded"}
              width="24"
              height="24"
            />
            <h2 className="text-xl font-bold text-[#8e78b7]">Generate Report</h2>
          </div>
          <button
            onClick={() => closeModal("modal1")}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 mb-4"></div>
        
        {/* Report Type */}
        <div className="relative mb-4">
          <label className="block text-sm text-black mb-1.5">Report Type</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white"
          >
            <option value="">Select</option>
            <option value="Migration">Migration</option>
            <option value="Purge">Purge</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-10 pointer-events-none text-gray-500"
            size={18}
          />
        </div>

        {/* Date Inputs */}
        <div className="flex gap-4 mb-4">
          <div className="relative w-1/2">
            <label className="block text-sm text-black mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
            />
          </div>
          <div className="relative w-1/2">
            <label className="block text-sm text-black mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
            />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-8">
        <div className="space-y-6">
          <div className="h-96">
            {/* Your content here */}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-8 pt-4">
        <div className="border-t border-gray-200 mb-4"></div>
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
        <div className="flex justify-start gap-4">
          <button
            onClick={() => closeModal("modal1")}
            className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
    onClick={handleGenerateReport}
    disabled={loading || !reportType || !startDate || !endDate}
    className={`px-6 py-2 rounded-lg transition-colors ${
      loading 
        ? 'bg-gray-300 cursor-not-allowed'
        : 'border border-gray-400 hover:bg-[#8e78b7] hover:text-white'
    }`}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <Icon 
          icon="svg-spinners:180-ring" 
          className="h-5 w-5 text-[#8e78b7] animate-spin" 
        />
        Creating...
      </div>
    ) : (
      'Create'
    )}
  </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Project Listing Table */}

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-black">
          <thead className="text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Workflow Name
              </th>
              <th scope="col" className="px-6 py-3">
                Report Type
              </th>
              <th scope="col" className="px-6 py-3">
                Execution Type
              </th>
              <th scope="col" className="px-6 py-3">
                Project
              </th>
              <th scope="col" className="px-6 py-3">
                Users
              </th>
              <th scope="col" className="px-6 py-3">
                Start date
              </th>
              <th scope="col" className="px-6 py-3">
                End date
              </th>
              <th scope="col" className="px-6 py-3">
                Source table
              </th>
              <th scope="col" className="px-6 py-3">
                Target table
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Remark
              </th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((user, index) => (
              // <tr key={index} className="border-b"></tr>
              <tr key={index} className="border-b dark:border-white-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-black-900 whitespace-nowrap dark:text-black"
                >
                  {user.id}
                </th>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.description}</td>
                <td className="px-6 py-4">{user.type}</td>
                <td className="px-6 py-4">{user.owner}</td>
                <td className="px-6 py-4">{user.created_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="px-6 py-4">{user.updated_by}</td>
                <td className="p-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      user.status === "Completed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">{user.updated_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenerateReport;
