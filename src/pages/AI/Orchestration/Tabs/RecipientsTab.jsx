import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

const RecipientsTab = () => {
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [selectedRole, setSelectedRole] = useState('Primary');
    const [openMenuId, setOpenMenuId] = useState(null);

    const availableUsers = [
        { id: 1, name: 'Ananya Mishra', email: 'ananyamishra12@gmail.com', initials: 'AM', color: '#E8D4F8' },
        { id: 2, name: 'John Smith', email: 'johnsmith42@gmail.com', initials: 'JS', color: '#D4E4F8' },
        { id: 3, name: 'Rachel Kim', email: 'rachel.kim@outlook.com', initials: 'RK', color: '#F8E4D4' },
        { id: 4, name: 'Tom Davis', email: 'tomdavis1990@yahoo.com', initials: 'TD', color: '#D4F8E4' },
        { id: 5, name: 'Linda Nguyen', email: 'linda.nguyen@gmail.com', initials: 'LN', color: '#F8D4E4' },
        { id: 6, name: 'Peter Brown', email: 'peterbrown@gmail.com', initials: 'PB', color: '#E4D4F8' },
    ];

    const handleAddRecipient = () => {
        if (selectedRecipient) {
            const user = availableUsers.find(u => u.id === parseInt(selectedRecipient));
            if (user && !recipients.find(r => r.id === user.id)) {
                const newRecipient = {
                    ...user,
                    role: selectedRole,
                    recipientId: Date.now() // unique identifier for this recipient entry
                };
                setRecipients([...recipients, newRecipient]);
            }
            setSelectedRecipient('');
            setSelectedRole('Primary');
        }
    };

    const handleRoleChange = (recipientId, newRole) => {
        setRecipients(recipients.map(r => 
            r.recipientId === recipientId ? { ...r, role: newRole } : r
        ));
        setOpenMenuId(null);
    };

    const handleRemoveRecipient = (recipientId) => {
        setRecipients(recipients.filter(r => r.recipientId !== recipientId));
        setOpenMenuId(null);
    };

    const toggleMenu = (recipientId) => {
        setOpenMenuId(openMenuId === recipientId ? null : recipientId);
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Add Recipients</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient</label>
                        <select
                            value={selectedRecipient}
                            onChange={(e) => setSelectedRecipient(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                        >
                            <option value="">Select</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                        >
                            <option value="Primary">Primary</option>
                            <option value="CC">CC</option>
                        </select>
                    </div>
                    <div className="sm:self-end">
                        <button
                            onClick={handleAddRecipient}
                            disabled={!selectedRecipient}
                            className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
                                selectedRecipient
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
                                    <span
                                        className={`px-3 py-1 rounded text-xs font-medium ${
                                            recipient.role === 'Primary'
                                                ? 'bg-purple-50 text-[#8e78b7] border border-purple-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}
                                    >
                                        {recipient.role}
                                    </span>
                                    <div className="relative">
                                        <button
                                            onClick={() => toggleMenu(recipient.recipientId)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-600" />
                                        </button>
                                        {openMenuId === recipient.recipientId && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setOpenMenuId(null)}
                                                />
                                                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                                    <button
                                                        onClick={() => handleRoleChange(recipient.recipientId, recipient.role === 'Primary' ? 'CC' : 'Primary')}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                                                    >
                                                        Change to {recipient.role === 'Primary' ? 'CC' : 'Primary'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveRecipient(recipient.recipientId)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </>
                                        )}
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