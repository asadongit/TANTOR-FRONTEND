import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, X, Plus } from 'lucide-react';
import { useStepData } from './StepContext';
import { useAuth } from '../../../../../../../context/AuthContext';

function AddRuleModal({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('High');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSeverity('High');
      setStatus('Active');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      setError('Rule Name and Description are required');
      return;
    }
    onSave({
      name,
      description,
      severity,
      status,
      query: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg border-2 border-[#8d77ba]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#8d77ba]">Add New Rule</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name*</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Description*</label>
            <textarea
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the rule"
            />
          </div>
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Severity</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
        </div>
        <div className="flex justify-end mt-8 gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7a67a0] font-medium transition-colors flex items-center justify-center ${
              !name.trim() || !description.trim() ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={!name.trim() || !description.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddGroupModal({ open, onClose, onSave }) {
  const [groupName, setGroupName] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('High');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setGroupName('');
      setRuleName('');
      setDescription('');
      setSeverity('High');
      setStatus('Active');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!groupName.trim() || !ruleName.trim() || !description.trim()) {
      setError('Group Name, Rule Name and Description are required');
      return;
    }
    onSave({
      groupName,
      rule: {
        name: ruleName,
        description,
        severity,
        status,
        query: "",
      }
    });
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tantor-toast', { detail: { message: 'This Group and Rule is not saved until performed all the steps till step 3', type: 'info' } }));
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg border-2 border-[#8d77ba]">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#8d77ba]">Add New Group</h2>
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
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Rule Name*</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Description*</label>
            <textarea
              className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the rule"
            />
          </div>
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Severity</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-700">Status</label>
              <select
                className="w-full border-2 border-gray-300 focus:border-[#8d77ba] rounded-md px-4 py-2"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
        </div>
        <div className="flex justify-end mt-8 gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7a67a0] font-medium transition-colors flex items-center justify-center ${
              !groupName.trim() || !ruleName.trim() || !description.trim() ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={!groupName.trim() || !ruleName.trim() || !description.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Step1({ onNext, onCancel, step1Data }) {
  const { setStepData } = useStepData();
  const { decodedToken, token } = useAuth();


  const [category, setCategory] = useState(step1Data?.category || null);
  const [type, setType] = useState(step1Data?.type || null);
  const [group, setGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groupData, setGroupData] = useState([]);
  const [selectedRules, setSelectedRules] = useState(() => {
    if (step1Data?.rules) {
      return Object.values(step1Data.rules).flat();
    }
    return [];
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [uiGroups, setUiGroups] = useState([]);
  const [groupNames, setGroupNames] = useState([
    'Accuracy', 'Consistency', 'Completeness', 'Validity', 'Uniqueness'
  ]);
  const [groupSearch, setGroupSearch] = useState('');
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false);
  const [uiRules, setUiRules] = useState({});
  const [modalSelectedRules, setModalSelectedRules] = useState([]);

  const fetchGroupNames = useCallback(() => {
    fetch(`${import.meta.env.VITE_FAST_API}/rules/listgroups`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.groups)) {
          setGroupNames(data.groups);
        }
      })
      .catch(error => {
        console.error('Error fetching group names:', error);
      });
  }, [token]);

  useEffect(() => {
    fetchGroupNames();
  }, [fetchGroupNames]);

  useEffect(() => {

    if (step1Data) {
      setCategory(step1Data.category || null);
      setType(step1Data.type || null);
      setSelectedRules(step1Data.rules ? Object.values(step1Data.rules).flat() : []);
    }
  }, [step1Data]);

  const handleNext = () => {
    const rulesByGroup = {};

    selectedRules.forEach(rule => {
      const groupName = rule.group_name;
      if (!rulesByGroup[groupName]) {
        rulesByGroup[groupName] = [];
      }
      rulesByGroup[groupName].push({
        ...rule,
        description: rule.description ?? rule.desc ?? "",
        owner: rule.owner ?? decodedToken?.preferred_username ?? "",
        severity: rule.severity ?? "High",
        status: rule.status ?? "Active",
      });
    });

    Object.entries(uiRules).forEach(([groupName, rules]) => {
      rules.forEach(rule => {
        if (!rulesByGroup[groupName]) rulesByGroup[groupName] = [];
        if (!rulesByGroup[groupName].some(r => r.id === rule.id)) {
          rulesByGroup[groupName].push({
            ...rule,
            description: rule.description ?? rule.desc ?? "",
            owner: rule.owner ?? decodedToken?.preferred_username ?? "",
            severity: rule.severity ?? "High",
            status: rule.status ?? "Active",
          });
        }
      });
    });

    const selectionData = {
      category,
      type,
      rules: rulesByGroup
    };

    setStepData(prev => ({ ...prev, step1: selectionData }));
    onNext(selectionData);
  };

  const fetchGroupRules = useCallback(async (selectedGroup) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/rules/addrule/list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category,
            type,
            group: selectedGroup,
          }),
        }
      );
      const data = await response.json();
      setGroupData(data.rules || []);
    } catch (error) {
      setGroupData([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, type, token]);

  const handleGroupClick = async (selectedGroup) => {
    if (!category || !type) {
      alert('Please select both category and type first');
      return;
    }
    setGroup(selectedGroup);
    setShowModal(true);
    fetchGroupRules(selectedGroup);
    // Set modal selection to current selected rules for this group
    setModalSelectedRules(
      selectedRules.filter(rule => rule.group_name === selectedGroup)
    );
  };

  // Helper for modal selection
  const isModalRuleSelected = (ruleId) => {
    return modalSelectedRules.some(rule => rule.id === ruleId);
  };

  const handleModalRuleSelection = (rule, e) => {
    if (e && e.target.type === 'checkbox') return;
    const isSelected = isModalRuleSelected(rule.id);
    if (isSelected) {
      setModalSelectedRules(prev =>
        prev.filter(selectedRule => selectedRule.id !== rule.id)
      );
    } else {
      setModalSelectedRules(prev => [...prev, rule]);
    }
  };

  const toggleModalCheckbox = (rule, e) => {
    e.stopPropagation();
    const isSelected = isModalRuleSelected(rule.id);
    if (isSelected) {
      setModalSelectedRules(prev =>
        prev.filter(selectedRule => selectedRule.id !== rule.id)
      );
    } else {
      setModalSelectedRules(prev => [...prev, rule]);
    }
  };

  const isRuleSelected = (ruleId) => {
    return selectedRules.some(rule => rule.id === ruleId);
  };

  const getSelectedCountForGroup = (groupName) => {
    return selectedRules.filter(rule => rule.group_name === groupName).length;
  };

  const handleAddRuleSave = (rule) => {
    setUiRules(prev => {
      const groupRules = prev[group] || [];
      // Assign a temp id for UI uniqueness
      const tempId = `ui_${Date.now()}`;
      return {
        ...prev,
        [group]: [
          ...groupRules,
          {
            ...rule,
            id: tempId,
            group_name: group,
            type,
            category,
            owner: decodedToken?.preferred_username,
            description: rule.description ?? rule.desc ?? "",
            severity: rule.severity ?? "High",
            status: rule.status ?? "Active",
          }
        ]
      };
    });
  };

  const handleAddGroupSave = ({ groupName, rule }) => {
    setUiGroups(prev => prev.includes(groupName) ? prev : [...prev, groupName]);
    setUiRules(prev => {
      const groupRules = prev[groupName] || [];
      const tempId = `ui_${Date.now()}`;
      return {
        ...prev,
        [groupName]: [
          ...groupRules,
          {
            ...rule,
            id: tempId,
            group_name: groupName,
            type,
            category,
            owner: decodedToken?.preferred_username,
            description: rule.description ?? rule.desc ?? "",
            severity: rule.severity ?? "High",
            status: rule.status ?? "Active",
          }
        ]
      };
    });
    setGroupNames(prev => prev.includes(groupName) ? prev : [...prev, groupName]);
  };

  const getAllRulesForGroup = (groupName) => {
    const apiRules = groupData.filter(r => r.group_name === groupName);
    const uiRulesArr = uiRules[groupName] || [];
    const all = [...apiRules, ...uiRulesArr.filter(u => !apiRules.some(a => a.id === u.id))];
    return all;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3">
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Category</h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCategory('Pre-built');
                  setSelectedRules([]);
                  setModalSelectedRules([]);
                }}
                className={`flex-1 py-3 px-4 rounded-md border-2 transition-all ${
                  category === 'Pre-built'
                    ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10 text-[#8d77ba] font-medium'
                    : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                }`}
              >
                Pre-built
              </button>

              <button
                onClick={() => {
                  setCategory('Custom');
                  setSelectedRules([]);
                  setModalSelectedRules([]);
                }}
                className={`flex-1 py-3 px-4 rounded-md border-2 transition-all ${
                  category === 'Custom'
                    ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10 text-[#8d77ba] font-medium'
                    : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Type</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setType('Metadata')}
                className={`flex-1 py-3 px-4 rounded-md border-2 transition-all ${
                  type === 'Metadata'
                    ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10 text-[#8d77ba] font-medium'
                    : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                }`}
              >
                Metadata
              </button>

              <button
                onClick={() => setType('Data')}
                className={`flex-1 py-3 px-4 rounded-md border-2 transition-all ${
                  type === 'Data'
                    ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10 text-[#8d77ba] font-medium'
                    : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                }`}
              >
                Data
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium border-b pb-2 mb-0">Group</h3>
            <input
              type="text"
              className="border border-[#8d77ba] rounded-md px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-[#8d77ba] text-sm"
              placeholder="Search group..."
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              style={{ marginLeft: 'auto' }}
            />
          </div>
          {category === 'Custom' && (
            <button
              type="button"
              className={`mb-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[#8d77ba] rounded-lg text-[#8d77ba] hover:bg-[#f3f0f9] transition
                ${!type ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              onClick={() => type && setAddGroupModalOpen(true)}
              disabled={!type}
            >
              <Plus size={18} />
              Add Group
            </button>
          )}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {[...new Set([...groupNames, ...uiGroups])]
              .filter(groupName =>
                groupName.toLowerCase().includes(groupSearch.trim().toLowerCase())
              )
              .map((groupName) => {
                const selectedCount = getSelectedCountForGroup(groupName);
                const isSelected = group === groupName;

                return (
                  <button
                    key={groupName}
                    onClick={() => handleGroupClick(groupName)}
                    className={`border-2 rounded-lg cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-md ${
                      isSelected
                        ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10'
                        : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                    }`}
                  >
                    <div className="p-6 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                          ${isSelected ? 'bg-[#8d77ba] text-white' : 'border-2 border-[#8d77ba] border-opacity-40 text-[#8d77ba]'}`}>
                          {groupName.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-lg ${isSelected ? 'font-medium text-[#8d77ba]' : ''}`}>
                          {groupName}
                        </span>
                        {selectedCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-[#8d77ba] text-xs text-white rounded-full">
                            {selectedCount}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 ${isSelected ? 'text-[#8d77ba]' : 'text-gray-400'}`} />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-10">
        <div className="text-sm text-gray-600">
          {selectedRules.length > 0 && (
            <span className="px-3 py-1.5 bg-[#8d77ba] bg-opacity-10 border border-[#8d77ba] text-[#8d77ba] rounded-full font-medium">
              {selectedRules.length} rules selected
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={selectedRules.length === 0}
            className={`px-6 py-2 rounded-lg transition-colors ${
              selectedRules.length > 0
                ? 'bg-[#8d77ba] text-white hover:bg-[#7a67a0]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-3/4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#8d77ba]">{group} Rules</h3>
              <div className="flex items-center gap-2">
                {/* Add Rule button for custom category */}
                {category === 'Custom' && (
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 border-2 border-[#8d77ba] text-[#8d77ba] rounded-lg hover:bg-[#f3f0f9] transition"
                    onClick={() => setAddRuleModalOpen(true)}
                  >
                    <Plus size={16} />
                    Add Rule
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8d77ba]"></div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-[#8d77ba] bg-opacity-5 border border-[#8d77ba] border-opacity-20 rounded-lg">
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 mr-2">Category:</span>
                        <span className="px-3 py-1 rounded-full bg-[#8d77ba] text-white text-sm">{category}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 mr-2">Type:</span>
                        <span className="px-3 py-1 rounded-full bg-[#8d77ba] text-white text-sm">{type}</span>
                      </div>

                    </div>
                  </div>

                  {getAllRulesForGroup(group).length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-left w-10">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-[#8d77ba] rounded"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newSelected = [...modalSelectedRules];
                                    getAllRulesForGroup(group).forEach(rule => {
                                      if (!isModalRuleSelected(rule.id)) {
                                        newSelected.push(rule);
                                      }
                                    });
                                    setModalSelectedRules(newSelected);
                                  } else {
                                    setModalSelectedRules(
                                      modalSelectedRules.filter(
                                        rule => rule.group_name !== group
                                      )
                                    );
                                  }
                                }}
                                checked={getAllRulesForGroup(group).length > 0 && getAllRulesForGroup(group).every(rule => isModalRuleSelected(rule.id))}
                              />
                            </th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Severity</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Owner</th>
                            <th className="p-3 text-left">Query</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getAllRulesForGroup(group).map(rule => (
                            <tr
                              key={rule.id}
                              className={`border-b hover:bg-gray-50 ${isModalRuleSelected(rule.id) ? 'bg-[#8d77ba] bg-opacity-5' : ''}`}
                              onClick={(e) => handleModalRuleSelection(rule, e)}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-5 w-5 text-[#8d77ba] rounded cursor-pointer"
                                  checked={isModalRuleSelected(rule.id)}
                                  onChange={(e) => toggleModalCheckbox(rule, e)}
                                />
                              </td>
                              <td className="p-3 font-medium text-[#8d77ba]">{rule.name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  rule.severity === 'High' ? 'bg-red-100 text-red-700' :
                                  rule.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {rule.severity}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  rule.status === 'Active' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {rule.status}
                                </span>
                              </td>
                              <td className="p-3">{rule.owner}</td>
                              <td className="p-3 truncate max-w-[200px]">
                                {rule.query || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      No rules found for this group, type, and category combination.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 border-t pt-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setModalSelectedRules([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Remove all selectedRules for this group, then add modalSelectedRules
                    setSelectedRules(prev => [
                      ...prev.filter(rule => rule.group_name !== group),
                      ...modalSelectedRules
                    ]);
                    setShowModal(false);
                    setModalSelectedRules([]);
                  }}
                  className="px-4 py-2 bg-[#8d77ba] text-white rounded hover:bg-[#7a67a0]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <AddRuleModal
            open={addRuleModalOpen}
            onClose={() => setAddRuleModalOpen(false)}
            onSave={handleAddRuleSave}
          />
        </div>
      )}

      <AddGroupModal
        open={addGroupModalOpen}
        onClose={() => setAddGroupModalOpen(false)}
        onSave={handleAddGroupSave}
      />
    </div>
  );
}

export default Step1;
