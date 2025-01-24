import React, { useState } from "react";
import { PlusCircle, MoreVertical, Users, Search, Plus } from "lucide-react";
import Breadcrumb from "../../../components/Breadcrumb";
import { Icon } from "@iconify-icon/react";

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
  const [roles, setRoles] = useState([
    {
      title: "Admin",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
      users: 4,
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
    },
    {
      title: "Manager",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy",
      users: 4,
      enabled: true,
      icon: "material-symbols:tab-group-outline",
      bgcolor: "bg-[#8d77ba] bg-opacity-25",
      iconcolor: "text-[#8d77ba]",
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      read: [],
      write: [],
      execute: []
    },
    duration: {
      from: '',
      to: ''
    }
  });

  const toggleRole = (index) => {
    const newRoles = [...roles];
    newRoles[index].enabled = !newRoles[index].enabled;
    setRoles(newRoles);
  };


  const handlePermissionChange = (type, roleIndex) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [type]: prev.permissions[type].includes(roleIndex)
          ? prev.permissions[type].filter(r => r !== roleIndex)
          : [...prev.permissions[type], roleIndex]
      }
    }));
  };

  const handleSave = () => {
    console.log('Form Data:', formData);
    setShowModal(false);
  };

  const handleNewRole = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {
        read: [],
        write: [],
        execute: []
      },
      duration: {
        from: '',
        to: ''
      }
    });
    setShowModal(true);
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
              className="pl-10 w-64 h-10 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search role"
            />
          </div>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon
              icon="material-symbols-light:format-list-bulleted"
              width="24"
              height="24"
              className="text-gray-600"
            />
          </button>

          <button className="p-1 px-1.5 rounded-lg border border-gray-400 hover:bg-gray-50">
            <Icon
              icon="material-symbols:autorenew-rounded"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100"
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
                <button className="p-1 rounded-lg hover:bg-gray-100">
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



      {/* modal for creating new role */}
      {showModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={() => setShowModal(false)}
      >
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
        <div className="flex items-center gap-2 mb-6">
          <Icon icon="material-symbols:supervisor-account-outline" width="24" height="24" className="text-[#8f79b8]" />
          <h3 className="text-lg font-bold text-[#8f79b8]">New role</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#8f79b8]">Permission</h4>
            <div className="grid grid-cols-3 gap-8 mt-2">
              {['read', 'write', 'execute'].map((permission) => (
                <div key={permission} className="space-y-4">
                  <label className="font-medium capitalize">{permission}</label>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${permission}-${i}`}
                        checked={formData.permissions[permission].includes(i)}
                        onChange={() => handlePermissionChange(permission, i)}
                        className="rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`${permission}-${i}`}
                        className="text-sm text-gray-500"
                      >
                        Role {i}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#8f79b8]">Duration</h4>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="date"
                placeholder="From"
                value={formData.duration.from}
                onChange={(e) => setFormData({
                  ...formData,
                  duration: { ...formData.duration, from: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                placeholder="To"
                value={formData.duration.to}
                onChange={(e) => setFormData({
                  ...formData,
                  duration: { ...formData.duration, to: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8f79b8] focus:border-transparent"
              />
            </div>
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
            <button
            className="flex items-center gap-2 px-4 py-2 text-[#8e78b7] border border-[#8e78b7] hover:bg-[#8e78b7] hover:text-white rounded-lg"
            onClick={handleNewRole}
            >
                 <Plus className="h-5 w-5" />

              New Role
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Role;
