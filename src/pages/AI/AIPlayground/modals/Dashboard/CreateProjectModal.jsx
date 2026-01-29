import { useState, useEffect, useRef } from 'react';
import { Info, X, Plus, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { toast } from 'react-hot-toast';

export const CreateProjectModal = ({ isOpen, onClose, onSubmit, projectList }) => {
  const hostnameAI = window._env_?.VITE_AI_API;
  const { token, decodedToken } = useAuth();
  const [formData, setFormData] = useState({
    projectName: '',
    members: [],
    description: ''
  });
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberOptions, setMemberOptions] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberSkip, setMemberSkip] = useState(0);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMembersData, setSelectedMembersData] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProjectName, setCreatedProjectName] = useState('');
  const searchTimeoutRef = useRef(null);
  const MEMBERS_LIMIT = 12;
  const memberDropdownRef = useRef(null);

  const projectNameExists = () => {
    if (!formData.projectName.trim() || !projectList) return false;
    return projectList.some(
      project => project.label.toLowerCase() === formData.projectName.trim().toLowerCase()
    );
  };

  const fetchMembers = async (skip = 0, search = '', isLoadMore = false) => {
    setIsLoadingMembers(true);
    try {
      let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${MEMBERS_LIMIT}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      const formattedMembers = data.users.map(user => ({
        value: user.id,
        label: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }));

      if (isLoadMore) {
        setMemberOptions(prev => [...prev, ...formattedMembers]);
      } else {
        setMemberOptions(formattedMembers);
      }

      setHasMoreMembers(data.has_more);
      setTotalMembers(data.total);
      setMemberSkip(skip);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isMemberDropdownOpen && memberOptions.length === 0) {
      fetchMembers(0, '');
    }
  }, [isMemberDropdownOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isMemberDropdownOpen) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchMembers(0, memberSearchQuery);
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [memberSearchQuery, isMemberDropdownOpen]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
      setIsMemberDropdownOpen(false);
    }
  };

  if (isMemberDropdownOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isMemberDropdownOpen]);

  const handleLoadMore = () => {
    if (!isLoadingMembers && hasMoreMembers) {
      const newSkip = memberSkip + MEMBERS_LIMIT;
      fetchMembers(newSkip, memberSearchQuery, true);
    }
  };

  const toggleMember = (value) => {
    const isCurrentlySelected = formData.members.includes(value);

    if (isCurrentlySelected) {
      setFormData(prev => ({
        ...prev,
        members: prev.members.filter(m => m !== value)
      }));
      setSelectedMembersData(prev => prev.filter(m => m.value !== value));
    } else {
      const memberData = memberOptions.find(m => m.value === value);
      if (memberData) {
        setFormData(prev => ({
          ...prev,
          members: [...prev.members, value]
        }));
        setSelectedMembersData(prev => [...prev, memberData]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (projectNameExists()) {
      alert('A project with this name already exists. Please choose a different name.');
      return;
    }

    if (formData.members.length === 0) {
      alert('Please select at least one member');
      return;
    }

    if (!decodedToken?.preferred_username) {
      alert('Unable to identify current user');
      return;
    }

    setIsSubmitting(true);

    try {
      const userIdResponse = await fetch(
        `${hostnameAI}/users/users/get-id?username=${decodedToken.preferred_username}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );

      if (!userIdResponse.ok) {
        throw new Error('Failed to get user ID');
      }

      const userIdData = await userIdResponse.json();
      const ownerId = userIdData.user_id;

      const selectedMemberUsernames = selectedMembersData.map(m => m.label);

      const createProjectResponse = await fetch(
        `${hostnameAI}/model/projects`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.projectName.trim(),
            description: formData.description.trim() || '',
            owner_id: ownerId,
            team_members: selectedMemberUsernames
          })
        }
      );

      if (!createProjectResponse.ok) {
        const errorData = await createProjectResponse.json().catch(() => ({}));
        toast.error('Failed to create project. Please try again.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      const result = await createProjectResponse.json();

      setCreatedProjectName(formData.projectName.trim());

      if (onSubmit) {
        onSubmit(result);
      }

      setShowSuccessModal(true);
      setFormData({ projectName: '', members: [], description: '' });
      setIsMemberDropdownOpen(false);
      setMemberSearchQuery('');
      setMemberOptions([]);
      setSelectedMembersData([]);
      setMemberSkip(0);
      setHasMoreMembers(false);
      setTotalMembers(0);
    } catch (error) {
      toast.error('Failed to create project. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ projectName: '', members: [], description: '' });
    setIsMemberDropdownOpen(false);
    setMemberSearchQuery('');
    setMemberOptions([]);
    setSelectedMembersData([]);
    setMemberSkip(0);
    setHasMoreMembers(false);
    setTotalMembers(0);
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCreatedProjectName('');
    onClose();
  };

  if (!isOpen && !showSuccessModal) return null;

  const selectedMemberLabels = selectedMembersData.map(m => m.label);
  const allSelectedMembersText = selectedMemberLabels.join(', ');
  const isDuplicateProject = projectNameExists();

  const validateProjectName = (name) => {
    if (!name.trim()) {
      return null;
    }

    if (!/^[A-Za-z]/.test(name.trim())) {
      return 'Project name must start with an alphabet.';
    }

    if (/^\d+$/.test(name.trim())) {
      return 'Project name cannot contain only digits';
    }

    const validCharPattern = /^[A-Za-z0-9_\-@#& ]+$/;
    if (!validCharPattern.test(name)) {
      return 'Only letters, numbers, underscore, hyphen, space, @, #, and & are allowed.';
    }

    return null;
  };

  const nameValidationError = validateProjectName(formData.projectName);

  const isFormValid = formData.projectName.trim() &&
    formData.members.length > 0 &&
    !isDuplicateProject &&
    !nameValidationError;

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Created Successfully!</h2>
            <p className="text-sm text-slate-600 mb-6">
              Your project "<span className="font-medium text-slate-900">{createdProjectName}</span>" has been created successfully.
            </p>
            <button
              onClick={handleSuccessModalClose}
              className="px-6 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d69a6] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {formData.projectName.length}/100
              </span>
            </div>
            <input
              type="text"
              placeholder="Enter Project Name"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              maxLength={100}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            {formData.projectName.trim() && isDuplicateProject && (
              <p className="text-xs text-red-500 mt-1">
                A project with this name already exists. Please choose a different name.
              </p>
            )}
            {formData.projectName.trim() && !isDuplicateProject && nameValidationError && (
              <p className="text-xs text-red-500 mt-1">
                {nameValidationError}
              </p>
            )}
          </div>

          <div className="relative" ref={memberDropdownRef}>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Member <span className="text-red-500">*</span> {formData.members.length > 0 && `(${formData.members.length} selected)`}
            </label>
            <button
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-left flex items-center justify-between"
              title={formData.members.length > 0 ? allSelectedMembersText : ''}
            >
              <span className={formData.members.length > 0 ? "text-slate-700" : "text-slate-400"}>
                {formData.members.length > 0
                  ? selectedMemberLabels.slice(0, 2).join(', ') + (formData.members.length > 2 ? ` +${formData.members.length - 2}` : '')
                  : "Select"
                }
              </span>
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
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {isLoadingMembers && memberOptions.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                      <span className="text-sm text-slate-500">Loading members...</span>
                    </div>
                  ) : memberOptions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No members found
                    </div>
                  ) : (
                    <div className="p-2">
                      {memberOptions.map((member) => (
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
                          <div className="flex-1">
                            <span className="text-sm text-slate-700">{member.label}</span>
                            {member.email && (
                              <span className="text-xs text-slate-400 ml-2">({member.email})</span>
                            )}
                          </div>
                        </label>
                      ))}

                      {hasMoreMembers && (
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoadingMembers}
                          className="w-full mt-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoadingMembers ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More ({memberOptions.length} of {totalMembers})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <span className="text-xs text-slate-400">
                {formData.description.length}/400
              </span>
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={400}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] rounded-md hover:bg-[#7d69a6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};