import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, MoreVertical, Users, Search, Plus } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";
import AddRole from "./Components/Role/AddRole";

const Toggle = ({ enabled, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-colors ease-in-out duration-200 ${
        enabled ? "bg-[#1a9962]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ease-in-out duration-200 m-0.5 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  );
};

const Role = () => {
  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const initialFetchDoneRef = useRef(false);

  const filteredRoles = roles.filter(role =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRole = (index) => {
    const newRoles = [...roles];
    const currentEnabled = newRoles[index].enabled;
    newRoles[index].enabled = !currentEnabled;
    newRoles[index].attributes.Status = [currentEnabled ? "Disabled" : "Enabled"];
    setRoles(newRoles);
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      FetchRoleDashboardData();
    }
  }, []);

  const FetchRoleDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/roleshomepage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      const transformedRoles = data.map(role => ({
        title: role.name,
        description: role.description || "No description available",
        users: role.user_count,
        enabled: role.attributes?.Status?.[0] === "Enabled",
        attributes: role.attributes || { Status: ["Disabled"] },
        icon: "material-symbols:tab-group-outline",
        bgcolor: "bg-[#8d77ba] bg-opacity-25",
        iconcolor: "text-[#8d77ba]",
      }));

      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (formData) => {
    console.log('Form Data:', formData);
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <Breadcrumb title="Data Governance" link="/" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Role</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="Search role"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
            )}
          </div>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              title="List view"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon
              icon="material-symbols:autorenew-rounded"
              title="Refresh"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#8e78b7] text-white rounded-lg"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-5 w-5" />
            New role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8e78b7]"></div>
        </div>
      ) : (
        <>
          {filteredRoles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoles.map((role, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 ${role.bgcolor} rounded-full ${role.iconcolor} mr-2`}
                        >
                          <Icon icon={role.icon} />
                        </div>
                        <h3 className="text-lg font-semibold">{role.title}</h3>
                      </div>
                      <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-500 mt-4 text-sm">{role.description}</p>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="material-symbols:supervisor-account-outline"
                          width="24"
                          height="24"
                        />
                        <span className="text-sm">
                          {role.users.toString().padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle
                          enabled={role.enabled}
                          onToggle={() => toggleRole(index)}
                        />
                        <span
                          className={`text-sm ${
                            role.enabled ? "text-[#1a9962]" : "text-gray-400"
                          }`}
                        >
                          {role.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 transition-opacity duration-300">
              <Icon icon="material-symbols:search-off-outline" width="48" height="48" className="mb-4 text-gray-400" />
              <p>No roles found matching "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-[#8e78b7] hover:underline transition-all duration-200"
              >
                Clear search
              </button>
            </div>
          )}
        </>
      )}

      <AddRole
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Role;
