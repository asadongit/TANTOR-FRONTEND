import { useState } from 'react';
import { Info, X, Plus, ChevronDown } from 'lucide-react';

export const CreateProjectModal = ({ isOpen, onClose, onSubmit, ownerOptions, memberOptions }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    owner: '',
    members: [],
    description: ''
  });
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const filteredMembers = memberOptions.filter(member =>
    member.label.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const toggleMember = (value) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(value)
        ? prev.members.filter(m => m !== value)
        : [...prev.members, value]
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ projectName: '', owner: '', members: [], description: '' });
    setIsMemberDropdownOpen(false);
    setMemberSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
          <div className="flex items-center gap-2">
            <button className="text-slate-400 hover:text-slate-600">
              <Info className="w-5 h-5" />
            </button>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Project Name
              </label>
              <input
                type="text"
                placeholder="Enter Project Name"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Owner</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white"
              >
                <option value="">Select</option>
                {ownerOptions.map((owner) => (
                  <option key={owner.value} value={owner.value}>{owner.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Member</label>
            <button
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between"
            >
              <span className="text-slate-400">Select</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isMemberDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-slate-200">
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto p-2">
                  {filteredMembers.map((member) => (
                    <label
                      key={member.value}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.members.includes(member.value)}
                        onChange={() => toggleMember(member.value)}
                        className="w-4 h-4 text-[#8e78b7] border-slate-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">{member.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setIsMemberDropdownOpen(false)}
                  className="w-full px-3 py-2 text-left text-sm text-[#8e78b7] hover:bg-violet-50 transition-colors border-t border-slate-200 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};


export const DatasetDescriptionModal = ({ isOpen, onClose, onSave, onSkip }) => {
  const [description, setDescription] = useState('');

  const handleSave = () => {
    onSave(description);
    setDescription('');
    onClose();
  };

  const handleSkip = () => {
    onSkip();
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Add Dataset Description</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">Note:</span> Provide a brief description to help identify and understand this dataset later.
          </p>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
            <textarea
              placeholder="Describe the uploaded data"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export const SelectDataViewModal = ({ isOpen, onClose, onProceed }) => {
  const [selectedView, setSelectedView] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableViews = [
    { value: 'view1', label: 'Sales Data View' },
    { value: 'view2', label: 'Customer Analytics View' },
    { value: 'view3', label: 'Product Performance View' },
    { value: 'view4', label: 'Transaction History View' },
  ];

  const handleProceed = () => {
    if (selectedView) {
      const selectedViewData = availableViews.find(v => v.value === selectedView);
      onProceed(selectedViewData);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedView('');
    setIsDropdownOpen(false);
    onClose();
  };

  const handleSelectView = (value) => {
    setSelectedView(value);
    setIsDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Select Data View</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            Choose a pre-configured database view to fetch data without uploading a file.
          </p>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Available Views
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between"
              >
                <span className={selectedView ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedView
                    ? availableViews.find(v => v.value === selectedView)?.label
                    : 'Select'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10">
                  <div className="max-h-48 overflow-y-auto">
                    {availableViews.map((view) => (
                      <button
                        key={view.value}
                        onClick={() => handleSelectView(view.value)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!selectedView}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d6ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResetProjectModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Reset project?</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600">
            This will remove the uploaded dataset and reset all configurations and workflows. This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Reset Project
          </button>
        </div>
      </div>
    </div>
  );
};