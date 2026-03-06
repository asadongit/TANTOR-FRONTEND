import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { tw } from '../../../../components/themeContext';

const RecipientsTab = ({ onRecipientsChange, initialRecipients = [] }) => {
    const [recipients, setRecipients] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const { token } = useAuth();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userSkip, setUserSkip] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const searchTimeoutRef = useRef(null);
    const USERS_LIMIT = 12;

    useEffect(() => {
        if (initialRecipients && initialRecipients.length > 0) {
            const colors = ['#E8D4F8', '#D4E4F8', '#F8E4D4', '#D4F8E4', '#F8D4E4', '#E4D4F8'];
            const formattedRecipients = initialRecipients.map((username, index) => {
                const colorIndex = Math.abs(username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                return {
                    id: username,
                    name: username,
                    initials: username.substring(0, 2).toUpperCase(),
                    color: colors[colorIndex],
                    role: 'Primary',
                    email: '',
                    recipientId: Date.now() + index
                };
            });
            setRecipients(formattedRecipients);
        }
    }, [initialRecipients]);

    const fetchUsers = async (skip = 0, search = '', isLoadMore = false) => {
        setIsLoadingUsers(true);
        try {
            let url = `${window._env_?.VITE_FAST_API}/auth/users?skip=${skip}&limit=${USERS_LIMIT}`;
            if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            const colors = ['#E8D4F8', '#D4E4F8', '#F8E4D4', '#D4F8E4', '#F8D4E4', '#E4D4F8'];

            const formattedUsers = data.users.map(user => {
                const colorIndex = Math.abs(user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                return {
                    id: user.id,
                    name: user.username,
                    initials: user.username.substring(0, 2).toUpperCase(),
                    color: colors[colorIndex],
                    email: user.email || '',
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
        if (isDropdownOpen && availableUsers.length === 0) fetchUsers(0, '');
    }, [isDropdownOpen]);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (isDropdownOpen) {
            searchTimeoutRef.current = setTimeout(() => fetchUsers(0, searchQuery), 500);
        }
        return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
    }, [searchQuery, isDropdownOpen]);

    const handleLoadMore = () => {
        if (!isLoadingUsers && hasMoreUsers) fetchUsers(userSkip + USERS_LIMIT, searchQuery, true);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleAddRecipients = () => {
        if (selectedUserIds.size === 0) return;

        const newRecipients = [];
        selectedUserIds.forEach(userId => {
            const user = availableUsers.find(u => u.id === userId);
            if (user && !recipients.find(r => r.name === user.name)) {
                newRecipients.push({
                    id: user.name,
                    name: user.name,
                    initials: user.initials,
                    color: user.color,
                    email: user.email || '',
                    role: 'Primary',
                    recipientId: Date.now() + Math.random()
                });
            }
        });

        const updatedRecipients = [...recipients, ...newRecipients];
        setRecipients(updatedRecipients);

        if (onRecipientsChange) {
            onRecipientsChange(updatedRecipients.map(r => r.name));
        }

        setSelectedUserIds(new Set());
        setIsDropdownOpen(false);
    };

    const handleRemoveRecipient = (recipientId) => {
        const updatedRecipients = recipients.filter(r => r.recipientId !== recipientId);
        setRecipients(updatedRecipients);
        if (onRecipientsChange) onRecipientsChange(updatedRecipients.map(r => r.name));
    };

    // Filter out already-added recipients from the dropdown list
    const recipientNames = new Set(recipients.map(r => r.name));
    const filteredUsers = availableUsers.filter(u => !recipientNames.has(u.name));

    const selectedCount = selectedUserIds.size;

    return (
        <div className="w-full flex flex-col h-full">
            {/* Add Recipients Section */}
            <div className="mb-6">
                <h2 className={tw.sectionHeading}>Add Recipients</h2>
                <div className="flex flex-row items-end gap-3 mt-4">
                    {/* Recipient Dropdown */}
                    <div className="relative w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] flex items-center justify-between"
                        >
                            <span className={selectedCount > 0 ? 'text-gray-700' : 'text-gray-400'}>
                                {selectedCount > 0 ? `${selectedCount} user${selectedCount > 1 ? 's' : ''} selected` : 'Select'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                    {/* Search */}
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
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#8e78b7]/20"
                                            />
                                        </div>
                                    </div>

                                    {/* User List */}
                                    <div className="max-h-60 overflow-y-auto">
                                        {isLoadingUsers && filteredUsers.length === 0 ? (
                                            <div className="flex items-center justify-center gap-2 p-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#8e78b7]" />
                                                <span className="text-sm text-gray-500">Loading users...</span>
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">No users found</div>
                                        ) : (
                                            <div className="p-2">
                                                {filteredUsers.map((user) => {
                                                    const isChecked = selectedUserIds.has(user.id);
                                                    return (
                                                        <button
                                                            key={user.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleUserSelection(user.id);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left transition-colors ${
                                                                isChecked ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {/* Checkbox */}
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                isChecked ? 'bg-[#8e78b7] border-[#8e78b7]' : 'border-gray-300 bg-white'
                                                            }`}>
                                                                {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                            </div>

                                                            {/* Avatar */}
                                                            <div
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0"
                                                                style={{ backgroundColor: user.color }}
                                                            >
                                                                {user.initials}
                                                            </div>

                                                            {/* Name + Email */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm text-gray-700 truncate">{user.name}</div>
                                                                {user.email && (
                                                                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}

                                                {hasMoreUsers && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLoadMore(); }}
                                                        disabled={isLoadingUsers}
                                                        className="w-full mt-2 px-3 py-2 text-sm text-[#8e78b7] hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {isLoadingUsers ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                                                        ) : (
                                                            <>Load More ({availableUsers.length} of {totalUsers})</>
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

                    {/* Add Button */}
                    <div>
                        <button
                            onClick={handleAddRecipients}
                            disabled={selectedCount === 0}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedCount > 0
                                    ? 'bg-[#8e78b7] text-white hover:bg-[#7a6aa0] cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected Users Section */}
            <div className="flex flex-col flex-1">
                <h3 className={tw.sectionHeading}>Selected Users</h3>
                {recipients.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center rounded-lg mt-4 py-20"
                        style={{ backgroundColor: '#FAFAFA'}}
                    >
                        <p className="text-base font-medium text-gray-900 mb-1">No recipients added yet</p>
                        <p className="text-sm text-gray-500">Add recipients to receive alerts and reports for this schedule.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto mt-4 rounded-lg">
                        {recipients.map((recipient) => (
                            <div
                                key={recipient.recipientId}
                                className="flex items-center justify-between px-4 py-2 mb-1.5 rounded-lg"
                                style={{ backgroundColor: '#FAFAFA' }}
                            >
                                {/* Avatar + Name + Email */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-[#8E77BB] flex-shrink-0"
                                        style={{ backgroundColor: '#F2EBFF' }}
                                    >
                                        {recipient.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#332849] truncate">{recipient.name}</p>
                                        {recipient.email && (
                                            <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveRecipient(recipient.recipientId)}
                                    className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded transition-colors group"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipientsTab;