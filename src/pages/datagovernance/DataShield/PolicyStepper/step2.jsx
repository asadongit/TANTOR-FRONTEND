import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { User, Users, UserPlus, UserRoundCog, Loader, Search } from "lucide-react";
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../../context/AuthContext';

const Step2 = ({ onDataChange, initialData }) => {
    const roleDetails = [
        { role: 'Role', icon: User, key: 'roles' },
        { role: 'Group', icon: Users, key: 'groups' },
        { role: 'Sub-group', icon: UserPlus, key: 'subgroups' },
        { role: 'Persona', icon: UserRoundCog, key: 'personas' },
    ];
    const { token } = useAuth();
    const [selectedTab, setSelectedTab] = useState('Role');
    const [selectedRole, setSelectedRole] = useState(initialData.selectedRole || '');
    const [selectedGroup, setSelectedGroup] = useState(initialData.selectedGroup || '');
    const [selectedSubgroup, setSelectedSubgroup] = useState(initialData.selectedSubgroup || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState({
        roles: [],
        groups: [],
        subgroups: [],
        personas: []
    });
    const [loading, setLoading] = useState(true);
    const [loadingSubgroups, setLoadingSubgroups] = useState(false);

    useEffect(() => {
        onDataChange({
            selectedRole,
            selectedGroup,
            selectedSubgroup
        });
    }, [selectedRole, selectedGroup, selectedSubgroup]);

    useEffect(() => {
        setSelectedRole(initialData.selectedRole || '');
        setSelectedGroup(initialData.selectedGroup || '');
        setSelectedSubgroup(initialData.selectedSubgroup || '');
    }, [initialData]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchSubgroupsForGroup(selectedGroup);
        } else {
            setData(prev => ({ ...prev, subgroups: [] }));
        }
    }, [selectedGroup]);

    useEffect(() => {
        // Reset search term when tab changes
        setSearchTerm('');
    }, [selectedTab]);

    const fetchData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/datapolicy`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const responseData = await response.json();
            setData({
                roles: responseData.roles || [],
                groups: responseData.groups || [],
                subgroups: [],
                personas: []
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching role list data:', error);
            setLoading(false);
        }
    };

    const fetchSubgroupsForGroup = async (group) => {
        setLoadingSubgroups(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_FAST_API}/auth/datapolicy/subgroup/${group}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch subgroups');
            }
            const responseData = await response.json();
            setData(prev => ({
                ...prev,
                subgroups: responseData.subgroups || []
            }));
        } catch (error) {
            console.error('Error fetching subgroups:', error);
            toast.error('Failed to load subgroups');
            setData(prev => ({
                ...prev,
                subgroups: []
            }));
        } finally {
            setLoadingSubgroups(false);
        }
    };

    const handleItemSelect = (item) => {
        switch (selectedTab) {
            case 'Role':
                setSelectedRole(item === selectedRole ? '' : item);
                break;
            case 'Group':
                if (item !== selectedGroup) {
                    setSelectedSubgroup('');
                }
                setSelectedGroup(item === selectedGroup ? '' : item);
                break;
            case 'Sub-group':
                if (!selectedGroup) {
                    toast.error('Please select a group first');
                    return;
                }
                setSelectedSubgroup(item === selectedSubgroup ? '' : item);
                break;
            default:
                break;
        }
    };

    const isItemSelected = (item) => {
        switch (selectedTab) {
            case 'Role': return item === selectedRole;
            case 'Group': return item === selectedGroup;
            case 'Sub-group': return item === selectedSubgroup;
            default: return false;
        }
    };

    const toggleSelectAll = () => {
        toast.info('Please select one item at a time');
    };

    const getCurrentTabData = () => {
        const currentTab = roleDetails.find(rd => rd.role === selectedTab);
        const tabData = currentTab ? data[currentTab.key] || [] : [];
        
        // Filter data based on search term
        if (searchTerm.trim() === '') {
            return tabData;
        }
        
        return tabData.filter(item => 
            item.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const renderListContent = () => {
        if (selectedTab === 'Sub-group') {
            if (!selectedGroup) {
                return (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Please select a Group first
                    </div>
                );
            }

            if (loadingSubgroups) {
                return (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Loading subgroups...
                    </div>
                );
            }

            if (data.subgroups.length === 0) {
                return (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No subgroups found for this group
                    </div>
                );
            }
        }

        const currentData = getCurrentTabData();
        if (currentData.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-gray-500">
                    {searchTerm.trim() ? 
                        `No ${selectedTab.toLowerCase()} found matching "${searchTerm}"` : 
                        `No ${selectedTab.toLowerCase()} found`}
                </div>
            );
        }

        return currentData.map((item, index) => (
            <div
                key={index}
                className="flex items-center justify-between px-4 py-2 border-t border-gray-200 hover:bg-gray-50"
            >
                <span className="truncate">{item}</span>
                <input
                    type="checkbox"
                    checked={isItemSelected(item)}
                    onChange={() => handleItemSelect(item)}
                />
            </div>
        ));
    };

    if (loading) {
        return (
            <Box className="flex justify-center items-center h-64">
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">User</h3>
                <div className="flex space-x-4 items-start h-[300px]">
                    <div className="flex flex-col w-1/4 space-y-2 bg-white h-full">
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
                                    <IconComponent className="h-5 w-5 mr-2 inline-block" />
                                    {role}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-3/4 h-full flex flex-col">
                        <div className="bg-gray-800 text-white rounded-t-md px-4 py-2 flex items-center justify-between">
                            <span className="font-medium">Name</span>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm">Select one</span>
                                <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={toggleSelectAll}
                                    disabled
                                />
                            </label>
                        </div>

                        {/* Search input */}
                        <div className="border border-t-0 border-gray-300 px-4 py-2">
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder={`Search ${selectedTab.toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </div>

                        <div className="border border-t-0 border-gray-300 rounded-b-md flex-1 overflow-y-auto">
                            {renderListContent()}
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );
};

export default Step2;