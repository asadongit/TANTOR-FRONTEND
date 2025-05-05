import React, { useState } from 'react';
import { Box } from '@mui/material';

const Step5 = () => {
    const checkbox_options = [
        'Read',
        'Update',
        'Write',
        'Delete',
        'Execute',
        'Select All',
    ];

    const [checkedItems, setCheckedItems] = useState(
        checkbox_options.reduce((acc, option) => ({ ...acc, [option]: false }), {})
    );

    const handleCheckboxChange = (option) => {
        if (option === 'Select All') {
            const newValue = !checkedItems['Select All'];
            const updatedItems = checkbox_options.reduce((acc, opt) => {
                acc[opt] = newValue;
                return acc;
            }, {});
            setCheckedItems(updatedItems);
        } else {
            const updatedItems = {
                ...checkedItems,
                [option]: !checkedItems[option],
            };

            const allSelectedExceptSelectAll = checkbox_options
                .filter((opt) => opt !== 'Select All')
                .every((opt) => updatedItems[opt]);

            updatedItems['Select All'] = allSelectedExceptSelectAll;
            setCheckedItems(updatedItems);
        }
    };

    return (
        <Box>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Permission</h3>
            <div className="grid grid-cols-2 gap-4 py-4">
                {checkbox_options.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={`checkbox-${index}`}
                            className="w-4 h-4"
                            checked={checkedItems[item]}
                            onChange={() => handleCheckboxChange(item)}
                        />
                        <label
                            htmlFor={`checkbox-${index}`}
                            className="text-sm font-medium text-gray-600"
                        >
                            {item}
                        </label>
                    </div>
                ))}
            </div>
        </Box>
    );
};

export default Step5;
