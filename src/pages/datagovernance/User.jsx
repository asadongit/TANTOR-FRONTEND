import React, { useState } from 'react';
import { Plus, RefreshCcw, Search, MoreHorizontal, Pencil, Trash2, RotateCw, X } from 'lucide-react';
import { Icon } from "@iconify-icon/react";

const User = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const sampleData = [
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
    { name: 'Amit Tandon', role: '01', persona: '01', group: '02', subGroup: '01', status: 'Completed' },
  ];

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-semibold">User</h1>

        <div className="flex items-center gap-4 ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search all user"
              className="pl-10 pr-4 py-2 w-[300px] border border-gray-300 rounded-lg focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <button className="p-2.5 rounded-lg bg-gray-100">
            <RefreshCcw className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8e78b7] text-white rounded-lg"
          >
            <Plus className="h-5 w-5" />
            Add user
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#29304a] text-white">
              <th className="w-8 p-4 first:rounded-tl-lg"><input type="checkbox" /></th>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Persona</th>
              <th className="text-left p-4">Group</th>
              <th className="text-left p-4">Sub group</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4 last:rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((user, index) => (
              <tr key={index} className="border-b">
                <td className="p-4"><input type="checkbox" /></td>
                <td className="p-4">{user.name}</td>
                <td className="p-4 text-gray-500 underline">{user.role}</td>
                <td className="p-4 text-gray-500 underline">{user.persona}</td>
                <td className="p-4 text-gray-500 underline">{user.group}</td>
                <td className="p-4">{user.subGroup}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.status === 'Completed' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.status}
                  </span>
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

      {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl w-[1000px] p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div >
            <Icon className="h-5 w-5 text-[#8e78b7]" icon={"material-symbols:supervisor-account-outline"} width="24" height="24" />

          </div>
          <h2 className="text-xl font-bold text-[#8e78b7]">Add user</h2>
        </div>
        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="space-y-6">
          <h3 className="text-[#8e78b7] font-medium">User</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-black mb-1.5">User name</label>
              <input
                type="text"
                placeholder="User name"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Confirm password</label>
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[#8e78b7] font-medium">User information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-black mb-1.5">First name</label>
              <input
                type="text"
                placeholder="First name"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Middle name</label>
              <input
                type="text"
                placeholder="Middle name"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Last name</label>
              <input
                type="text"
                placeholder="Last name"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Email id</label>
              <input
                type="email"
                placeholder="Email id"
                className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[#8e78b7] font-medium">Roles</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-black mb-1.5">Roles</label>
              <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                <option>Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Persona</label>
              <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                <option>Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Group</label>
              <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                <option>Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-black mb-1.5">Sub-group</label>
              <select className="w-full p-2.5 border border-gray-400 rounded-lg focus:outline-none focus:border-[#8e78b7] focus:ring-1 focus:ring-[#8e78b7] appearance-none bg-white">
                <option>Select</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start gap-4 mt-8">
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-[#8e78b7] hover:text-white transition-colors">
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};



export default User;