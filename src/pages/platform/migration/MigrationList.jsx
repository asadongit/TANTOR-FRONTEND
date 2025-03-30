import { Icon } from "@iconify-icon/react";
import { useState } from "react";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  RotateCw
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

const MigrationList = ({ records }) => {

  console.log(records);

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(null);

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  
  const handleCreateMigration = () => {
    navigate('/Migrationcanvas'); 
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
    },
    {
      id: "01",
      name: "Amit Tandon",
      description: "MySQL Connection",
      type: "mysql",
      owner: "novi",
      created_by: "novi",
      updated_by: "novi",
    },
  ];

  const cards = [
    {
      icon: "material-symbols:database-upload-outline",
      bgcolor: "bg-[#d8d3e4] bg-opacity-25",
      iconcolor: "text-purple-700",
      title: "Oracle",
      count: "27",
    },
    {
      icon: "material-symbols-light:two-pager-store-outline",
      bgcolor: "bg-[#FFC93F] bg-opacity-25",
      iconcolor: "text-orange-700",
      title: "DB2",
      count: "11",
    },
    {
      icon: "material-symbols:cloud-sync-outline",
      bgcolor: "bg-[#96CF7B] bg-opacity-25",
      iconcolor: "text-green-700",
      title: "MS SQL",
      count: "07",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "MySQL",
      count: "17",
    },
    {
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#16ABC2] bg-opacity-25",
      iconcolor: "text-cyan-700",
      title: "Postgres",
      count: "06",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">Project</h1>
        <div>
          <button
            onClick={handleCreateMigration}
            type="button"
            className="text-white bg-[#8e78b7] hover:bg-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-[#8e78b7] dark:hover:bg-[#8e78b7] focus:outline-none dark:focus:ring-[#8e78b7]"
          >
            Create Migration
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white p-6 rounded-lg shadow-sm border-gray-200`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`flex items-center justify-center aspect-square w-8 md:w-10 ${card.bgcolor} rounded-full ${card.iconcolor} mr-2`}
              >
                <Icon icon={card.icon} />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
            <p className="text-black text-5xl font-bold">{card.count}</p>
            <button className="mt-4 text-purple-600 text-sm hover:text-purple-700">
              See details
            </button>
          </div>
        ))}
      </div>


      {/* Project Listing Table */}

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
        <table className="w-full text-sm text-left rtl:text-right text-black">
          <thead className="text-xs text-white-700 uppercase dark:bg-[#282F49] dark:text-white">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Project Name
              </th>
              <th scope="col" className="px-6 py-3">
                Created By
              </th>
              <th scope="col" className="px-6 py-3">
                Target Connection
              </th>
              <th scope="col" className="px-6 py-3">
                Source Connection
              </th>
              <th scope="col" className="px-6 py-3">
                Source Table
              </th>
              <th scope="col" className="px-6 py-3">
                Target Table
              </th>
              <th scope="col" className="px-6 py-3">
                Start Date
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3"></th>
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
                <td className="px-6 py-4 text-center">{user.name}</td>
                <td className="px-6 py-4 text-center">{user.description}</td>
                <td className="px-6 py-4 text-center">{user.type}</td>
                <td className="px-6 py-4 text-center">{user.owner}</td>
                <td className="px-6 py-4 text-center">{user.created_by}</td>
                <td className="px-6 py-4 text-center">{user.updated_by}</td>
                <td className="px-6 p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.status === 'Completed' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.updated_by}
                  </span>
                </td>
                <td className="px-6 p-4 text-center">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                      className="p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {activeMenu === index && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={handleClickOutside}
                        />
                        <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20 animate-fadeIn">
                          <div className="flex items-center p-1 gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                              <RotateCw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MigrationList;
    