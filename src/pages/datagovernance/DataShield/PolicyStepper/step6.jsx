import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

const Step6 = ({ policyData, onDataChange }) => {
    const permissionOptions = [
        'read',
        'update',
        'write',
        'delete',
        'execute'
    ];

    // Initialize from existing permissions or default to all false
    const [permissions, setPermissions] = useState(
        policyData.permissions || {
            read: false,
            update: false,
            write: false,
            delete: false,
            execute: false
        }
    );

    const [selectAll, setSelectAll] = useState(false);

    // Update parent when permissions change
    useEffect(() => {
        onDataChange({ permissions });
    }, [permissions]);

    const handlePermissionChange = (permission) => {
        const newPermissions = {
            ...permissions,
            [permission]: !permissions[permission]
        };
        setPermissions(newPermissions);
        
        // Update select all status
        setSelectAll(Object.values(newPermissions).every(val => val));
    };

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        const newPermissions = permissionOptions.reduce((acc, permission) => {
            acc[permission] = newSelectAll;
            return acc;
        }, {});
        
        setPermissions(newPermissions);
        setSelectAll(newSelectAll);
    };

    return (
        <Box>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Permissions</h3>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="select-all"
                        className="w-4 h-4"
                        checked={selectAll}
                        onChange={handleSelectAll}
                    />
                    <label
                        htmlFor="select-all"
                        className="text-sm font-medium text-gray-600"
                    >
                        Select All
                    </label>
                </div>
                
                {permissionOptions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={`permission-${permission}`}
                            className="w-4 h-4"
                            checked={permissions[permission]}
                            onChange={() => handlePermissionChange(permission)}
                        />
                        <label
                            htmlFor={`permission-${permission}`}
                            className="text-sm font-medium text-gray-600 capitalize"
                        >
                            {permission}
                        </label>
                    </div>
                ))}
            </div>
        </Box>
    );
};

export default Step6;