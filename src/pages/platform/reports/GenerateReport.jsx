import { Icon } from "@iconify-icon/react";
import { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  Search,
  BadgeCheck,
} from "lucide-react";
import successBackground from "../../../assets/green.png";

const GenerateReport = () => {
  const [isModalOpen, setIsModalOpen] = useState({
    modal1: false,
    modal2: false,
  });

  // Function to open a specific modal
  const openModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: true }));
  };

  // Function to close a specific modal
  const closeModal = (modalName) => {
    setIsModalOpen((prevState) => ({ ...prevState, [modalName]: false }));
  };

  // const [isModalOpen, setIsModalOpen] = useState(false);

  const [refresh, setRefresh] = useState(0);
  const handleRefresh = () => {
    setRefresh((prev) => prev + 1);
  };

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[1000px] p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div>
                  <Icon
                    className="h-5 w-5 text-[#8e78b7]"
                    icon={"material-symbols:tactic-rounded"}
                    width="24"
                    height="24"
                  />
                </div>
                <h2 className="text-xl font-bold text-[#8e78b7]">
                  Create a Project
                </h2>
              </div>
              <button
                onClick={() => closeModal("modal1")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name"
                      className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Sub Category
                      </label>
                      <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                        <option>Select</option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-black mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Description"
                      className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Manager
                      </label>
                      <input
                        type="text"
                        placeholder="Manager"
                        className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
                      />
                      <Search
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <label className="block text-sm text-black mb-1.5">
                        Category
                      </label>
                      <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                        <option>Select</option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-10 pointer-events-none text-gray-500"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-4 mt-8">
              <button
                onClick={() => closeModal("modal1")}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => openModal("modal2")}
                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Project Model */}

      {isModalOpen.modal2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] overflow-hidden">
            <div className="relative h-24">
              {" "}
              {/* Increased height */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${successBackground})` }}
              >
                <button
                  onClick={() => closeModal("modal2")}
                  className="absolute top-4 right-4 text-black p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <BadgeCheck className="w-8 h-8 text-green-500" />{" "}
                {/* Increased icon size */}
                <h2 className="text-2xl font-bold">Congratulations!</h2>{" "}
                {/* Larger text */}
              </div>
              <p className="text-lg text-gray-800">
                {" "}
                {/* Larger text */}
                You have successfully created a project.
              </p>

              <div className="flex justify-start gap-4 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-lg border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
                >
                  Alright
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
