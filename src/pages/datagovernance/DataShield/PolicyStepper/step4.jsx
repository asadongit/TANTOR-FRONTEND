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

const Step4 = ({ policyData, onDataChange }) => {
    const [selectedTable, setSelectedTable] = useState('');
    const [tableSearch, setTableSearch] = useState('');


    const initialFilters = policyData.row_access_control || {};
    const [tableFilters, setTableFilters] = useState(initialFilters);


    const allTables = policyData.data_connection.flatMap(conn => 
        conn.tables.map(table => ({
            fullPath: table,
            connection: conn.connection,
            schema: conn.schema,
            tableName: table.split('.').pop()
        }))
    );

    const getColumnsForSelectedTable = () => {
        if (!selectedTable) return [];
        
        const tableConn = policyData.data_connection.find(conn => 
            conn.tables.includes(selectedTable)
        );
        
        return tableConn?.columns
            .filter(col => col.startsWith(selectedTable))
            .map(col => col.split('.').pop()) || [];
    };

    const handleTableChange = (event) => {
        setSelectedTable(event.target.value);
    };

    const handleAddFilter = () => {
        if (!selectedTable) return;
        
        const newFilter = {
            column: '',
            operator: '=',
            value: '',
            logicWithNext: 'OR' 
        };

        setTableFilters(prev => ({
            ...prev,
            [selectedTable]: [...(prev[selectedTable] || []), newFilter]
        }));
    };

    const handleFilterChange = (table, index, field, value) => {
        const updatedFilters = {
            ...tableFilters,
            [table]: tableFilters[table].map((filter, i) => 
                i === index ? { ...filter, [field]: value } : filter
            )
        };
        
        setTableFilters(updatedFilters);
        onDataChange({ row_access_control: updatedFilters });
    };

    const handleLogicChange = (table, index, value) => {
        const updatedFilters = { ...tableFilters };
        if (updatedFilters[table] && index < updatedFilters[table].length - 1) {
            updatedFilters[table][index].logicWithNext = value;
            setTableFilters(updatedFilters);
            onDataChange({ row_access_control: updatedFilters });
        }
    };

    const handleRemoveFilter = (table, index) => {
        const updatedFilters = {
            ...tableFilters,
            [table]: tableFilters[table].filter((_, i) => i !== index)
        };
        
        if (updatedFilters[table].length === 0) {
            delete updatedFilters[table];
        }
        
        setTableFilters(updatedFilters);
        onDataChange({ row_access_control: updatedFilters });
    };

    const isFilterComplete = (filter) => {
        return filter.column && filter.value;
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
            {Object.keys(tableFilters).map(table => (
                <Chip
                    key={table}
                    label={table.split('.').pop()}
                    onClick={() => setSelectedTable(table)}
                    color={selectedTable === table ? 'primary' : 'default'}
                    sx={{ 
                        borderRadius: 1,
                        fontWeight: selectedTable === table ? 'bold' : 'normal',
                        ...(selectedTable === table && {
                            backgroundColor: '#8e78b7',
                            '&:hover': {
                                backgroundColor: '#7b689e'
                            }
                        })
                    }}
                />
            ))}
        </Box>
    );

    const renderFilterControls = () => {
        if (!selectedTable) return null;
        const filters = tableFilters[selectedTable] || [];

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
                    mb: 2,
                }}>
                    <Typography variant="subtitle1">
                        Filters for: {selectedTable.split('.').pop()}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Plus size={16} />}
                        onClick={handleAddFilter}
                        disabled={filters.length > 0 && !isFilterComplete(filters[filters.length - 1])}
                        sx={{
                            '&:not(:disabled)': {
                                borderColor: '#8e78b7',
                                color: '#8e78b7',
                                '&:hover': {
                                    borderColor: '#7b689e',
                                    backgroundColor: 'rgba(142, 120, 183, 0.04)'
                                }
                            }
                        }}
                    >
                        Add Condition
                    </Button>
                </Box>

                {filters.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No conditions added yet
                    </Typography>
                ) : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto', marginTop: "5px" }}>
                        {filters.map((filter, index) => (
                            <Box key={index}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1} mt={1}>
                                    <FormControl sx={{ minWidth: 180 }}>
                                        <InputLabel>Column</InputLabel>
                                        <Select
                                            value={filter.column}
                                            onChange={(e) => handleFilterChange(selectedTable, index, 'column', e.target.value)}
                                            label="Column"
                                            size="small"
                                        >
                                            {getColumnsForSelectedTable().map(column => (
                                                <MenuItem key={column} value={column}>
                                                    {column}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl sx={{ minWidth: 100 }}>
                                        <InputLabel>Operator</InputLabel>
                                        <Select
                                            value={filter.operator}
                                            onChange={(e) => handleFilterChange(selectedTable, index, 'operator', e.target.value)}
                                            label="Operator"
                                            size="small"
                                        >
                                            {['=', '!=', '>', '<', '>=', '<='].map(op => (
                                                <MenuItem key={op} value={op}>{op}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Value"
                                        value={filter.value}
                                        onChange={(e) => handleFilterChange(selectedTable, index, 'value', e.target.value)}
                                        size="small"
                                        sx={{ flex: 1 }}
                                    />

                                    <IconButton 
                                        onClick={() => handleRemoveFilter(selectedTable, index)}
                                        size="small"
                                        sx={{ color: 'error.main' }}
                                    >
                                        <Trash2 size={18} />
                                    </IconButton>
                                </Box>

                                {index < filters.length - 1 && (
                                    <Box sx={{ 
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        my: 1
                                    }}>
                                        <FormControl sx={{ minWidth: 120 }}>
                                            <Select
                                                value={filter.logicWithNext}
                                                onChange={(e) => handleLogicChange(selectedTable, index, e.target.value)}
                                                size="small"
                                            >
                                                <MenuItem value="AND">AND</MenuItem>
                                                <MenuItem value="OR">OR</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 3, color: '#8e78b7' }}>Access Control - Row</Typography>
            
            {renderTableSelect()}
            {Object.keys(tableFilters).length > 0 && renderTableChips()}
            {renderFilterControls()}
        </Box>
    );
};

export default Step4;