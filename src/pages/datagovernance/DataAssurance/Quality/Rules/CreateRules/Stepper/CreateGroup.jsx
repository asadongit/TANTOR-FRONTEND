import React, { useState } from 'react';
import { useAuth } from '../../../../../../../context/AuthContext';
import { X } from 'lucide-react';

function CreateGroup({ open, onClose, type, category, owner, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('High');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();

  if (!open) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_FAST_API}/rules/creategroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
         },
        body: JSON.stringify({
          type,
          category,
          group_name: groupName,
          name: ruleName,
          description,
          severity,
          status,
          owner,
          query: '',
        }),
      });

      if (!res.ok) throw new Error('Failed to create group');

      setSuccess('Group created successfully');
      // If we have an onGroupCreated callback, call it to refresh the groups list
      if (typeof onGroupCreated === 'function') {
        onGroupCreated();
      }

      setTimeout(() => {
        setSuccess('');
        onClose();
        // Reset form fields
        setGroupName('');
        setRuleName('');
        setDescription('');
        setSeverity('High');
        setStatus('Active');
      }, 1500);
    } catch (e) {
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg border-2 border-[#8d77ba]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#8d77ba]">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Group Name*</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] focus:ring focus:ring-[#8d77ba] focus:ring-opacity-30 rounded-md px-4 py-2 transition-colors"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              disabled={loading}
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name*</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] focus:ring focus:ring-[#8d77ba] focus:ring-opacity-30 rounded-md px-4 py-2 transition-colors"
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              disabled={loading}
              placeholder="Enter rule name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Description*</label>
            <textarea
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] focus:ring focus:ring-[#8d77ba] focus:ring-opacity-30 rounded-md px-4 py-2 transition-colors"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              placeholder="Describe the rule"
            />
          </div>

          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Severity</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] focus:ring focus:ring-[#8d77ba] focus:ring-opacity-30 rounded-md px-4 py-2 transition-colors"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                disabled={loading}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] focus:ring focus:ring-[#8d77ba] focus:ring-opacity-30 rounded-md px-4 py-2 transition-colors"
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">{success}</div>}
        </div>

        <div className="flex justify-end mt-8 gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7a67a0] font-medium transition-colors flex items-center justify-center ${
              loading || !groupName.trim() || !ruleName.trim() || !description.trim() ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={loading || !groupName.trim() || !ruleName.trim() || !description.trim()}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Saving...
              </>
            ) : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroup;
