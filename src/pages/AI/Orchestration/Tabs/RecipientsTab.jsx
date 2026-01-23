import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const RecipientsTab = ({ onRecipientsChange }) => {
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [selectedRole, setSelectedRole] = useState('Primary');
    const { token, decodedToken } = useAuth();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSkip, setUserSkip] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const searchTimeoutRef = useRef(null);
    const USERS_LIMIT = 12;
    const hostnameAI = window._env_?.VITE_AI_API;

    const fetchUsers = async (skip = 0, search = '', isLoadMore = false) => {
        setIsLoadingUsers(true);
        try {
            let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${USERS_LIMIT}`;
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

            const formattedUsers = data.users.map(user => {
                const initials = user.username.substring(0, 2).toUpperCase();
                const colors = ['#E8D4F8', '#D4E4F8', '#F8E4D4', '#D4F8E4', '#F8D4E4', '#E4D4F8'];
                const colorIndex = Math.abs(user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                const color = colors[colorIndex];

                return {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    initials: initials,
                    color: color,
                    firstName: user.firstName,
                    lastName: user.lastName
                };
            });

            if (isLoadMore) {
                setAvailableUsers(prev => [...prev, ...formattedUsers]);
            } else {
                setAvailableUsers(formattedUsers);
            }

            setHasMoreUsers(data.has_more);
            setTotalUsers(data.total);
            setUserSkip(skip);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users. Please try again.');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (isDropdownOpen && availableUsers.length === 0) {
            fetchUsers(0, '');
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (isDropdownOpen) {
            searchTimeoutRef.current = setTimeout(() => {
                fetchUsers(0, searchQuery);
            }, 500);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, isDropdownOpen]);

    const handleLoadMore = () => {
        if (!isLoadingUsers && hasMoreUsers) {
            const newSkip = userSkip + USERS_LIMIT;
            fetchUsers(newSkip, searchQuery, true);
        }
    };

    const handleAddRecipient = () => {
        if (selectedRecipient) {
            const user = availableUsers.find(u => u.id === selectedRecipient);

            if (user && !recipients.find(r => r.id === user.id)) {
                const newRecipient = {
                    ...user,
                    role: selectedRole,
                    recipientId: Date.now()
                };

                const updatedRecipients = [...recipients, newRecipient];
                setRecipients(updatedRecipients);

                if (onRecipientsChange) {
                    const recipientNames = updatedRecipients.map(r => r.name);
                    onRecipientsChange(recipientNames);
                }
            }
            setSelectedRecipient('');
            setSelectedRole('Primary');
            setIsDropdownOpen(false);
        }
    };

    const handleRemoveRecipient = (recipientId) => {
        const updatedRecipients = recipients.filter(r => r.recipientId !== recipientId);
        setRecipients(updatedRecipients);

        if (onRecipientsChange) {
            const recipientNames = updatedRecipients.map(r => r.name);
            onRecipientsChange(recipientNames);
        }
    };

    const selectedUser = availableUsers.find(u => u.id === selectedRecipient);

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Add Recipients</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-left bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] flex items-center justify-between"
                        >
                            <span className={selectedRecipient ? "text-gray-700" : "text-gray-400"}>
                                {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Select"}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 max-w-md">
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <svg className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto">
                                        {isLoadingUsers && availableUsers.length === 0 ? (
                                            <div className="flex items-center justify-center gap-2 p-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#8e78b7]" />
                                                <span className="text-sm text-gray-500">Loading users...</span>
                                            </div>
                                        ) : availableUsers.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                No users found
                                            </div>
                                        ) : (
                                            <div className="p-2">
                                                {availableUsers.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            setSelectedRecipient(user.id.toString());
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer text-left"
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0"
                                                            style={{ backgroundColor: user.color }}
                                                        >
                                                            {user.initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm text-gray-700 truncate">{user.name}</div>
                                                            {user.email && (
                                                                <div className="text-xs text-gray-400 truncate">{user.email}</div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}

                                                {hasMoreUsers && (
                                                    <button
                                                        onClick={handleLoadMore}
                                                        disabled={isLoadingUsers}
                                                        className="w-full mt-2 px-3 py-2 text-sm text-[#8e78b7] hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {isLoadingUsers ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Load More ({availableUsers.length} of {totalUsers})
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Role Selection - Commented out for now */}
                    {/* <div className="sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                        >
                            <option value="Primary">Primary</option>
                            <option value="CC">CC</option>
                        </select>
                    </div> */}
                    <div className="sm:self-end">
                        <button
                            onClick={handleAddRecipient}
                            disabled={!selectedRecipient}
                            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${selectedRecipient
                                    ? 'bg-[#8e78b7] text-white hover:bg-[#7a6aa0] cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Selected Users</h3>
                {recipients.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-base font-medium text-gray-900 mb-1">No recipients added yet</p>
                        <p className="text-sm text-gray-500">Add recipients to receive alerts and reports for this schedule.</p>
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                        {recipients.map((recipient) => (
                            <div
                                key={recipient.recipientId}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-gray-700"
                                        style={{ backgroundColor: recipient.color }}
                                    >
                                        {recipient.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{recipient.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Role Badge - Commented out for now */}
                                    {/* <span
                                    className={`px-3 py-1 rounded text-xs font-medium ${
                                        recipient.role === 'Primary'
                                            ? 'bg-purple-50 text-[#8e78b7] border border-purple-200'
                                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                                >
                                    {recipient.role}
                                </span> */}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleRemoveRecipient(recipient.recipientId)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipientsTab;