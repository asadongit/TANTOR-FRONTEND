import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
import {
    Trash2,
    MoreHorizontal,
    RotateCw,
    List,
    RefreshCcw,
    Code,
    Plus,
    LinkIcon,
    Search,
    MoreVertical,
    Pencil,
    X,
    User, Group, Users, Shield,
    UserPlus,
    UserRoundCog,
    BadgeCheck
} from "lucide-react";
import { useState } from 'react';

const Step2 = () => {
    const items = ['Audit_msg', 'Audit_msg', 'Audit_msg'];
    const roleDetails = [
        { role: 'Role', icon: User },
        { role: 'Group', icon: Users },
        { role: 'Sub-group', icon: UserPlus },
        { role: 'Persona', icon: UserRoundCog },
    ];
    const [selectedTab, setSelectedTab] = useState('Role');
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleItem = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items);
        }
    };

    return (
        <Box>
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">User</h3>
                <div className="flex space-x-4 items-start">
                    <div className="flex flex-col w-1/4 space-y-2 bg-white">
                        {roleDetails.map(({ role, icon: IconComponent }) => {
                            return (
                                <button
                                    key={role}
                                    className={`text-left px-4 py-2 rounded-lg border ${selectedTab === role
                                        ? 'bg-purple-100 text-[#8e78b7] border-[#8e78b7]'
                                        : 'hover:bg-gray-100 text-gray-600 border-gray-200'
                                        }`}
                                    onClick={() => setSelectedTab(role)}
                                >
                                    <IconComponent className=" h-5 w-5 mr-2 inline-block" />
                                    {role}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-3/4">
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-800 text-white rounded-t-md px-4 py-2 flex items-center justify-between">
                                <span className="font-medium">Name</span>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <span className="text-sm">Select all</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === items.length}
                                        onChange={toggleSelectAll}
                                    />
                                </label>
                            </div>

                            <div className="border border-t-0 border-gray-300 rounded-b-md overflow-y-auto" style={{ maxHeight: '100%' }}>
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-2 border-t border-gray-200"
                                    >
                                        <span>{item}</span>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item)}
                                            onChange={() => toggleItem(item)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    )
}
export default Step2;