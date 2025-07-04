import React, { useState, useEffect } from 'react';
import { X, Loader, Check, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import DetailsModal from './DetailsModal';

const AssignPolicyModal = ({ isOpen, onClose, onApplyPolicies, initialSelectedPolicyIds,setNewPolicies }) => {
    const { token } = useAuth();
    const [policies, setPolicies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingConnections, setIsFetchingConnections] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPolicyIds, setSelectedPolicyIds] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsModalTitle, setDetailsModalTitle] = useState('');
    const [detailsModalItems, setDetailsModalItems] = useState([]);
    const [detailsModalType, setDetailsModalType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setSearchQuery("")
        if (isOpen) {
            fetchPolicies();
            setError(null);
            setSelectedPolicyIds(initialSelectedPolicyIds.map(id => Number(id)));
        }
    }, [isOpen, initialSelectedPolicyIds]);

    const fetchPolicies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/listpolicy`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch policies');
            }

            const data = await response.json();
            setPolicies(data.policies || []);
        } catch (err) {
            console.error('Error fetching policies:', err);
            setError(err.message || 'Failed to load policies.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewConnections = async (policyId) => {
        setIsFetchingConnections(true);
        setError(null);
        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/listconnectiondetails/${policyId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch connection details');
            }

            const data = await response.json();
            openDetailsModal('Connection Details', data.data_connection || [], 'connectionDetails');
        } catch (err) {
            console.error('Error fetching connection details:', err);
            setError(err.message || 'Failed to load connection details.');
            openDetailsModal('Connection Details', [], 'connectionDetails');
        } finally {
            setIsFetchingConnections(false);
        }
    };

    const handlePolicySelect = (policyId) => {
        setSelectedPolicyIds((prev) =>
            prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
        );
    };

    const handleApply = () => {
        console.log('selected policy ids areee =======>', selectedPolicyIds);
        const selectedPoliciesData = policies.filter((p) => selectedPolicyIds.includes(p.id));

        const combinedRoles = new Set();
        const combinedPersonas = new Set();
        const combinedGroups = new Set();
        const combinedSubgroups = new Set();
        const dataPolicyIds = [];

        selectedPoliciesData.forEach((policy) => {
            const userSelections = policy.user_selections;
            if (userSelections) {
                if (userSelections.role && userSelections.role !== '') {
                    combinedRoles.add(userSelections.role);
                }
                if (userSelections.persona) {
                    if (Array.isArray(userSelections.persona)) {
                        userSelections.persona.forEach((p) => p !== '' && combinedPersonas.add(p));
                    } else if (typeof userSelections.persona === 'string' && userSelections.persona !== '') {
                        combinedPersonas.add(userSelections.persona);
                    }
                }
                if (userSelections.group && userSelections.group !== '') {
                    combinedGroups.add(userSelections.group);
                }
                if (userSelections.subGroup && userSelections.subGroup !== '') {
                    combinedSubgroups.add(userSelections.subGroup);
                }
            }
            dataPolicyIds.push(policy.id);
        });

        onApplyPolicies({
            roles: Array.from(combinedRoles),
            persona: Array.from(combinedPersonas),
            datapolicy: dataPolicyIds,
            groups: Array.from(combinedGroups),
            subgroups: Array.from(combinedSubgroups),
        });

        setNewPolicies((prev) => prev.filter((policy) => selectedPolicyIds.includes(policy.id)));
        
        onCloseModal();
    };

    const onCloseModal = () => {
        setSelectedPolicyIds([]);
        onClose();
    };

    const openDetailsModal = (title, items, type = '') => {
        setDetailsModalTitle(title);
        setDetailsModalItems(items);
        setDetailsModalType(type);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setDetailsModalTitle('');
        setDetailsModalItems([]);
        setDetailsModalType('');
    };

    const filteredPolicies = policies.filter((policy) => {
        const query = searchQuery.toLowerCase();
        return (
            policy.id.toString().includes(query) ||
            policy.policy_type.toLowerCase().includes(query) ||
            policy.sub_policy_name.toLowerCase().includes(query)
        );
    });

    // Function to count enabled permissions
    const countEnabledPermissions = (permissions) => {
        if (!permissions) return 0;
        return Object.values(permissions).filter((value) => value === true).length;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[95%] max-w-[1400px] h-[80vh] p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#8e78b7]">Assign Existing Policy</h2>
                    <button onClick={onCloseModal} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by ID / Type / Name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8e78b7] w-full max-w-md"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader className="h-8 w-8 animate-spin text-[#8e78b7]" />
                        <span className="ml-2 text-gray-700">Loading policies...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                ) : (
                    <>
                        <div className="overflow-auto flex-grow mb-6 border border-gray-300 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#8e78b7] text-white sticky top-0">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider w-12"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-[#8e78b7] rounded"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPolicyIds(filteredPolicies.map((p) => p.id));
                                                    } else {
                                                        setSelectedPolicyIds([]);
                                                    }
                                                }}
                                                checked={
                                                    selectedPolicyIds.length === filteredPolicies.length &&
                                                    filteredPolicies.length > 0
                                                }
                                                ref={(el) => {
                                                    if (el) {
                                                        el.indeterminate =
                                                            selectedPolicyIds.length > 0 &&
                                                            selectedPolicyIds.length < filteredPolicies.length;
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            ID
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Type
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Name
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Roles
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Row Controls
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Column Controls
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Reports
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Permissions
                                        </th>
                                        <th
                                            scope="col"
                                            className="p-3 text-left text-xs font-medium uppercase tracking-wider"
                                        >
                                            Connections
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPolicies.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="10"
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                            >
                                                No policies found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPolicies.map((policy) => {
                                            const rowAccessControlCount = policy.row_access_control
                                                ? Object.keys(policy.row_access_control).length
                                                : 0;
                                            const columnAccessControlCount = policy.column_access_control
                                                ? Object.keys(policy.column_access_control).length
                                                : 0;
                                            const reportsCount = policy.reports ? policy.reports.length : 0;
                                            const permissionsCount = countEnabledPermissions(policy.permissions);

                                            return (
                                                <tr key={policy.id} className="hover:bg-gray-50">
                                                    <td className="p-3 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox h-4 w-4 text-[#8e78b7] rounded"
                                                            checked={selectedPolicyIds.includes(policy.id)}
                                                            onChange={() => handlePolicySelect(policy.id)}
                                                        />
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        {policy.id}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800 max-w-[150px] truncate tooltip">
                                                        {policy.policy_type}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800 max-w-[150px] truncate tooltip">
                                                        {policy.sub_policy_name}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        <button
                                                            onClick={() =>
                                                                openDetailsModal('Roles Details', policy.user_selections, 'roles')
                                                            }
                                                            className="text-[#8e78b7] hover:text-[#7a64a3]"
                                                            title="View Roles Details"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        {rowAccessControlCount > 0 ? (
                                                            <button
                                                                onClick={() =>
                                                                    openDetailsModal(
                                                                        'Row Access Controls',
                                                                        policy.row_access_control,
                                                                        'accessControl'
                                                                    )
                                                                }
                                                                className="text-[#8e78b7] underline hover:text-[#7a64a3]"
                                                            >
                                                                {rowAccessControlCount}
                                                            </button>
                                                        ) : (
                                                            <span>0</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        {columnAccessControlCount > 0 ? (
                                                            <button
                                                                onClick={() =>
                                                                    openDetailsModal(
                                                                        'Column Access Controls',
                                                                        policy.column_access_control,
                                                                        'accessControl'
                                                                    )
                                                                }
                                                                className="text-[#8e78b7] underline hover:text-[#7a64a3]"
                                                            >
                                                                {columnAccessControlCount}
                                                            </button>
                                                        ) : (
                                                            <span>0</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        {reportsCount > 0 ? (
                                                            <button
                                                                onClick={() =>
                                                                    openDetailsModal('Reports', policy.reports, 'reports')
                                                                }
                                                                className="text-[#8e78b7] underline hover:text-[#7a64a3]"
                                                            >
                                                                {reportsCount}
                                                            </button>
                                                        ) : (
                                                            <span>0</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        {permissionsCount > 0 ? (
                                                            <button
                                                                onClick={() =>
                                                                    openDetailsModal(
                                                                        'Permissions',
                                                                        policy.permissions,
                                                                        'permissions'
                                                                    )
                                                                }
                                                                className="text-[#8e78b7] underline hover:text-[#7a64a3]"
                                                            >
                                                                {permissionsCount}
                                                            </button>
                                                        ) : (
                                                            <span>0</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                                                        <button
                                                            onClick={() => handleViewConnections(policy.id)}
                                                            className="text-[#8e78b7] hover:text-[#7a64a3]"
                                                            title="View Connections"
                                                            disabled={isFetchingConnections}
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4 mt-auto">
                            <button
                                onClick={onCloseModal}
                                className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors text-black"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={selectedPolicyIds.length === 0}
                                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                                    selectedPolicyIds.length === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-[#8e78b7] hover:bg-[#7a64a3]'
                                }`}
                            >
                                Apply Policies ({selectedPolicyIds.length})
                            </button>
                        </div>
                    </>
                )}
            </div>
            <DetailsModal
                isOpen={isDetailsModalOpen}
                onClose={closeDetailsModal}
                title={detailsModalTitle}
                items={detailsModalItems}
                type={detailsModalType}
            />
        </div>
    );
};

export default AssignPolicyModal;