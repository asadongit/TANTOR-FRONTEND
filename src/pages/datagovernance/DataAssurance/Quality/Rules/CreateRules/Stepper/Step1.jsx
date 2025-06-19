import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Plus } from 'lucide-react';
import { useStepData } from './StepContext';
import CreateGroup from './CreateGroup';

function Step1({ onNext, onCancel, step1Data }) {
  const { setStepData } = useStepData();

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
      rulesByGroup[groupName].push(rule);
    });

    const selectionData = {
      category,
      type,
      rules: rulesByGroup
    };

    setStepData(prev => ({ ...prev, step1: selectionData }));
    onNext(selectionData);
  };

  const handleGroupClick = async (selectedGroup) => {
    if (!category || !type) {
      alert('Please select both category and type first');
      return;
    }

    setGroup(selectedGroup);
    setShowModal(true);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/rules/addrule/list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category,
            type,
            group: selectedGroup,
          }),
        }
      );

      const data = await response.json();
      console.log('API Response:', data.rules);
      setGroupData(data.rules || []);
    } catch (error) {
      console.error('Error calling API:', error);
      setGroupData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleSelection = (rule, e) => {
    if (e && e.target.type === 'checkbox') {
      return;
    }

    const isSelected = selectedRules.some(selectedRule => selectedRule.id === rule.id);

    if (isSelected) {
      setSelectedRules(prevSelected =>
        prevSelected.filter(selectedRule => selectedRule.id !== rule.id)
      );
    } else {
      setSelectedRules(prevSelected => [...prevSelected, rule]);
    }
  };

  const toggleCheckbox = (rule, e) => {
    e.stopPropagation();

    const isSelected = isRuleSelected(rule.id);

    if (isSelected) {
      setSelectedRules(prevSelected =>
        prevSelected.filter(selectedRule => selectedRule.id !== rule.id)
      );
    } else {
      setSelectedRules(prevSelected => [...prevSelected, rule]);
    }
  };

  const isRuleSelected = (ruleId) => {
    return selectedRules.some(rule => rule.id === ruleId);
  };

  const getSelectedCountForGroup = (groupName) => {
    return selectedRules.filter(rule => rule.group_name === groupName).length;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3">
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Category</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setCategory('Pre-built')}
                className={`flex-1 py-3 px-4 rounded-md border-2 transition-all ${
                  category === 'Pre-built'
                    ? 'border-[#8d77ba] bg-[#8d77ba] bg-opacity-10 text-[#8d77ba] font-medium'
                    : 'border-[#8d77ba] border-opacity-30 hover:border-opacity-70'
                }`}
              >
                Pre-built
              </button>

              <button
                onClick={() => setCategory('Custom')}
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
          <h3 className="text-lg font-medium mb-4 border-b pb-2">Group</h3>

          {category === 'Custom' && (
            <button
              type="button"
              className={`mb-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[#8d77ba] rounded-lg text-[#8d77ba] hover:bg-[#f3f0f9] transition
                ${!type ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              onClick={() => type && setShowCreateGroup(true)}
              disabled={!type}
            >
              <Plus size={18} />
              Add Group
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Accuracy', 'Consistency', 'Completeness', 'Validity', 'Uniqueness'].map((groupName) => {
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
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
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
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 mr-2">Group:</span>
                        <span className="px-3 py-1 rounded-full bg-[#8d77ba] text-white text-sm">{group}</span>
                      </div>
                    </div>
                  </div>

                  {groupData.length > 0 ? (
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
                                    const newSelectedRules = [...selectedRules];
                                    groupData.forEach(rule => {
                                      if (!isRuleSelected(rule.id)) {
                                        newSelectedRules.push(rule);
                                      }
                                    });
                                    setSelectedRules(newSelectedRules);
                                  } else {
                                    setSelectedRules(selectedRules.filter(
                                      rule => rule.group_name !== group
                                    ));
                                  }
                                }}
                                checked={groupData.length > 0 && groupData.every(rule => isRuleSelected(rule.id))}
                              />
                            </th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Severity</th>
                            <th className="p-3 text-left">Owner</th>
                            <th className="p-3 text-left">Group</th>
                            <th className="p-3 text-left">Query</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupData.map(rule => (
                            <tr
                              key={rule.id}
                              className={`border-b hover:bg-gray-50 ${isRuleSelected(rule.id) ? 'bg-[#8d77ba] bg-opacity-5' : ''}`}
                              onClick={(e) => handleRuleSelection(rule, e)}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-5 w-5 text-[#8d77ba] rounded cursor-pointer"
                                  checked={isRuleSelected(rule.id)}
                                  onChange={(e) => toggleCheckbox(rule, e)}
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
                              <td className="p-3">{rule.owner}</td>
                              <td className="p-3">{rule.group_name}</td>
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-[#8d77ba] text-white rounded hover:bg-[#7a67a0]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateGroup open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </div>
  );
}

export default Step1;
