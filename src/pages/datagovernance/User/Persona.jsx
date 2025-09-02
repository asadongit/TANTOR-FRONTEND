import React, { useEffect, useState } from "react";
import { MoreVertical, Search, Plus, Info, MoreHorizontal, Pencil, Trash2, RotateCw } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";

function Persona() {
  const [showModal, setShowModal] = useState(false);
  const [persona, setPersona] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Updated process function to handle the new API response format
  const processPersonaData = (apiData) => {
    // Check if we have the expected data structure
    if (!apiData || !apiData.persona_counts) {
      console.error("Invalid API response format:", apiData);
      return [];
    }

    // Convert persona_counts object to array of persona objects
    return Object.entries(apiData.persona_counts)
      .filter(([name]) => name.trim() !== "") // Filter out empty persona names
      .map(([title, count]) => {
        // Convert to title case for consistency
        const normalizedTitle = title.trim().charAt(0).toUpperCase() + title.trim().slice(1).toLowerCase();

        return {
          title: normalizedTitle,
          description: "Users with this persona role have specific access and permissions",
          users: count,
          enabled: true, // Assuming all personas are enabled by default
          icon: "material-symbols:tab-group-outline",
          bgcolor: "bg-[#8d77ba] bg-opacity-25",
          iconcolor: "text-[#8d77ba]",
        };
      });
  };

  const toggleRole = (index) => {
    const newPersona = [...persona];
    newPersona[index].enabled = !newPersona[index].enabled;
    setPersona(newPersona);
  };

  const [formData, setFormData] = useState({
    groupname: "",
    description: "",
  });

  const [activeMenu, setActiveMenu] = useState(null);
  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  const sampleData = [
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
    { id: "1", name: "Amit Tandon", description: "this is a sample desctiption", status: "Enabled", subGroup: "Customer", createdDate: "22/01/2025", updatedDate: "22/01/2025" },
  ];

  const handleSave = () => {
    setShowModal(false);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${window._env_?.VITE_FAST_API}/auth/personahomepage`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const processedData = processPersonaData(data);
        setPersona(processedData);
      })
      .catch((error) => {
        console.error("Error fetching personas:", error);
        setError("Failed to load personas. Please try again later.");
        // Set some default sample personas if the API fails
        setPersona([
          {
            title: "Admin",
            description: "Users with this persona role have specific access and permissions",
            users: 8,
            enabled: true,
            icon: "material-symbols:tab-group-outline",
            bgcolor: "bg-[#8d77ba] bg-opacity-25",
            iconcolor: "text-[#8d77ba]",
          },
          {
            title: "User",
            description: "Users with this persona role have specific access and permissions",
            users: 12,
            enabled: true,
            icon: "material-symbols:tab-group-outline",
            bgcolor: "bg-[#8d77ba] bg-opacity-25",
            iconcolor: "text-[#8d77ba]",
          }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <Breadcrumb/>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Persona</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search group"
            />
          </div>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon icon="material-symbols-light:format-list-bulleted" width="24" height="24" className="text-gray-600" />
          </button>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon icon="material-symbols:autorenew-rounded" width="24" height="24" className="text-gray-600" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg" onClick={() => setShowModal(true)}>
            <Plus className="h-5 w-5" />
            New Persona
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8d77ba]"></div>
        </div>
      ) : error ? (
        <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      ) : persona.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 text-gray-600 rounded-lg">
          No personas found. Create your first persona by clicking "New Persona" button.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persona.map((persona, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${persona.bgcolor} rounded-full ${persona.iconcolor} mr-2`}
                    >
                      <Icon icon={persona.icon} />
                    </div>
                    <h3 className="text-lg font-semibold">{persona.title}</h3>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-500 mt-4 text-sm">{persona.description}</p>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" />
                    <span className="text-sm">{persona.users.toString().padStart(2, "0")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Description</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Sub group</th>
              <th className="text-left p-4">Created Date</th>
              <th className="text-left p-4">Updated Date</th>
              <th className="w-8 p-4 first:rounded-tl-lg">Select</th>
              <th className="text-left p-4 last:rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((user, index) => (
              <tr key={index} className="border-b">
                <td className="p-4">{user.id}</td>
                <td className="p-4 text-gray-500 ">{user.name}</td>
                <td className="p-4 text-gray-500 ">{user.description}</td>
                <td className="p-4 text-gray-500 ">{user.status}</td>
                <td className="p-4 text-gray-500">{user.subGroup}</td>
                <td className="p-4 text-gray-500">{user.createdDate}</td>
                <td className="p-4 text-gray-500">{user.updatedDate}</td>
                <td className="p-4 text-gray-500">
                  <input type="checkbox" />
                </td>

                <td className="p-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                      className="p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {activeMenu === index && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={handleClickOutside} />
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

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold text-[#8f79b8] mr-2">Add Group</h3>
                <Info className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={formData.groupname}
                    onChange={(e) => setFormData({ ...formData, groupname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
                    rows="6"
                  ></textarea>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Persona;