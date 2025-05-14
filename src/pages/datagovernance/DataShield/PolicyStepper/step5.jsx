import {
    Box,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    OutlinedInput,
    ListItemText,
    ListSubheader,
    TextField,
    Button,
    IconButton,
    Divider,
    Chip,
    Typography
} from '@mui/material';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const Step5 = ({ policyData, onDataChange }) => {
    const [selectedTable, setSelectedTable] = useState('');
    const [tableSearch, setTableSearch] = useState('');

    // Initialize from existing column_access_control
    const initialControls = policyData.column_access_control || {};
    const [tableControls, setTableControls] = useState(initialControls);

    // Extract all tables from data_connection
    const allTables = policyData.data_connection.flatMap(conn => 
        conn.tables.map(table => ({
            fullPath: table,
            connection: conn.connection,
            schema: conn.schema,
            tableName: table.split('.').pop()
        }))
    );

    // Get columns for selected table
    const getColumnsForSelectedTable = () => {
        if (!selectedTable) return [];
        
        const tableConn = policyData.data_connection.find(conn => 
            conn.tables.includes(selectedTable)
        );
        
        return tableConn?.columns
            .filter(col => col.startsWith(selectedTable))
            .map(col => ({
                fullPath: col,
                columnName: col.split('.').pop()
            })) || [];
    };

    const handleTableChange = (event) => {
        setSelectedTable(event.target.value);
    };

    const handleAddControl = () => {
        if (!selectedTable) return;
        
        const newControl = {
            column: '',
            type: 'masking' // Default to masking
        };

        setTableControls(prev => ({
            ...prev,
            [selectedTable]: [...(prev[selectedTable] || []), newControl]
        }));
    };

    const handleControlChange = (table, index, field, value) => {
        const updatedControls = {
            ...tableControls,
            [table]: tableControls[table].map((control, i) => 
                i === index ? { ...control, [field]: value } : control
            )
        };
        
        setTableControls(updatedControls);
        onDataChange({ column_access_control: updatedControls });
    };

    const handleRemoveControl = (table, index) => {
        const updatedControls = {
            ...tableControls,
            [table]: tableControls[table].filter((_, i) => i !== index)
        };
        
        // Remove table entry if no controls left
        if (updatedControls[table].length === 0) {
            delete updatedControls[table];
        }
        
        setTableControls(updatedControls);
        onDataChange({ column_access_control: updatedControls });
    };

    const isControlComplete = (control) => {
        return control.column;
    };

    const renderTableSelect = () => (
        <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Table</InputLabel>
            <Select
                value={selectedTable}
                onChange={handleTableChange}
                input={<OutlinedInput label="Select Table" />}
                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
                <ListSubheader>
                    <TextField
                        size="small"
                        placeholder="Search tables..."
                        fullWidth
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        autoFocus
                    />
                </ListSubheader>
                {allTables
                    .filter(table => 
                        table.fullPath.toLowerCase().includes(tableSearch.toLowerCase())
                    )
                    .map((table) => (
                        <MenuItem key={table.fullPath} value={table.fullPath}>
                            <ListItemText 
                                primary={table.tableName}
                                secondary={`${table.connection} > ${table.schema}`}
                            />
                        </MenuItem>
                    ))
                }
            </Select>
        </FormControl>
    );

    const renderTableChips = () => (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {Object.keys(tableControls).map(table => (
                <Chip
                    key={table}
                    label={table.split('.').pop()}
                    onClick={() => setSelectedTable(table)}
                    color={selectedTable === table ? 'primary' : 'default'}
                    sx={{ 
                        borderRadius: 1,
                        fontWeight: selectedTable === table ? 'bold' : 'normal'
                    }}
                />
            ))}
        </Box>
    );

    const renderControlItems = () => {
        if (!selectedTable) return null;
        const controls = tableControls[selectedTable] || [];

        return (
            <Box sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                mb: 3
            }}>
                <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="subtitle1">
                        Column Controls for: {selectedTable.split('.').pop()}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={handleAddControl}
                        disabled={controls.length > 0 && !isControlComplete(controls[controls.length - 1])}
                    >
                        Add Column Control
                    </Button>
                </Box>

                {controls.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No column controls added yet
                    </Typography>
                ) : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {controls.map((control, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                    <FormControl sx={{ minWidth: 180 }}>
                                        <InputLabel>Column</InputLabel>
                                        <Select
                                            value={control.column}
                                            onChange={(e) => handleControlChange(selectedTable, index, 'column', e.target.value)}
                                            label="Column"
                                            size="small"
                                        >
                                            {getColumnsForSelectedTable().map(col => (
                                                <MenuItem key={col.fullPath} value={col.fullPath}>
                                                    {col.columnName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl sx={{ minWidth: 120 }}>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={control.type}
                                            onChange={(e) => handleControlChange(selectedTable, index, 'type', e.target.value)}
                                            label="Type"
                                            size="small"
                                        >
                                            <MenuItem value="masking">Masking</MenuItem>
                                            <MenuItem value="hashing">Hashing</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <IconButton 
                                        onClick={() => handleRemoveControl(selectedTable, index)}
                                        size="small"
                                        sx={{ color: 'error.main' }}
                                    >
                                        <Trash2 size={18} />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>Column Access Control</Typography>
            
            {renderTableSelect()}
            {Object.keys(tableControls).length > 0 && renderTableChips()}
            {renderControlItems()}
        </Box>
    );
};

export default Step5;