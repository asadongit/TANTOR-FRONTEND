import {
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    OutlinedInput,
    Checkbox,
    ListItemText,
    ListSubheader,
    TextField
  } from '@mui/material';
  import { useAuth } from '../../../../context/AuthContext';
  import { useEffect, useState } from 'react';
  import { Box, Typography } from '@mui/material';
  
  const Step3 = ({ name, onDataChange, initialData }) => {
    const { token } = useAuth();
  
    const [data, setData] = useState([]);
    const [selectedConnections, setSelectedConnections] = useState([]);
    const [selectedSchemas, setSelectedSchemas] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
  
    // search filters
    const [connectionSearch, setConnectionSearch] = useState('');
    const [schemaSearch, setSchemaSearch] = useState('');
    const [tableSearch, setTableSearch] = useState('');
    const [columnSearch, setColumnSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        onDataChange({
          selectedConnections,
          selectedSchemas,
          selectedTables,
          selectedColumns
        });
      }, [selectedConnections, selectedSchemas, selectedTables, selectedColumns]);
  
    useEffect(() => {
      fetchData();
    }, []);
  
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_FAST_API}/connectionscreen`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const responseData = await response.json();
        setData(responseData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
  
    const getUnique = (arr) => [...new Set(arr)];
  
    const connectionOptions = getUnique(data.map(item => item.connection_name));
    const filteredConnections = connectionOptions.filter(c =>
      c.toLowerCase().includes(connectionSearch.toLowerCase())
    );
  
    const schemaOptions = getUnique(
      data
        .filter(d => selectedConnections.includes(d.connection_name))
        .map(d => `${d.connection_name}.${d.table_schema}`)
    );
    const filteredSchemas = schemaOptions.filter(s =>
      s.toLowerCase().includes(schemaSearch.toLowerCase())
    );
  
    const tableOptions = getUnique(
      data
        .filter(d =>
          selectedConnections.includes(d.connection_name) &&
          selectedSchemas.includes(`${d.connection_name}.${d.table_schema}`)
        )
        .map(d => `${d.connection_name}.${d.table_schema}.${d.table_name}`)
    );
    const filteredTables = tableOptions.filter(t =>
      t.toLowerCase().includes(tableSearch.toLowerCase())
    );
  
    const columnOptions = getUnique(
      data
        .filter(d =>
          selectedConnections.includes(d.connection_name) &&
          selectedSchemas.includes(`${d.connection_name}.${d.table_schema}`) &&
          selectedTables.includes(`${d.connection_name}.${d.table_schema}.${d.table_name}`)
        )
        .flatMap(d =>
          d.column_json.map(col =>
            `${d.connection_name}.${d.table_schema}.${d.table_name}.${col.column_name}`
          )
        )
    );
    const filteredColumns = columnOptions.filter(col =>
      col.toLowerCase().includes(columnSearch.toLowerCase())
    );
  
    const handleChange = (setter, resetList = []) => (event) => {
      const {
        target: { value },
      } = event;
      setter(typeof value === 'string' ? value.split(',') : value);
      resetList.forEach(reset => reset([]));
    };
  
    const renderSearchableSelect = (label, options, selectedValues, setSelectedValues, searchValue, setSearchValue, resetList = []) => (
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          multiple
          value={selectedValues}
          onChange={handleChange(setSelectedValues, resetList)}
          input={<OutlinedInput label={label} />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
        >
          <ListSubheader>
            <TextField
              size="small"
              placeholder="Search..."
              fullWidth
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </ListSubheader>
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              <Checkbox checked={selectedValues.includes(option)} />
              <ListItemText primary={option} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );

     if (loading) {
            return (
                <Box className="flex justify-center items-center h-64">
                    <Typography>Loading...</Typography>
                </Box>
            );
        }
  
    return (
      <Box>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{name}</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
  
          {renderSearchableSelect(
            'Connection',
            filteredConnections,
            selectedConnections,
            setSelectedConnections,
            connectionSearch,
            setConnectionSearch,
            [setSelectedSchemas, setSelectedTables, setSelectedColumns]
          )}
  
          {renderSearchableSelect(
            'Schema',
            filteredSchemas,
            selectedSchemas,
            setSelectedSchemas,
            schemaSearch,
            setSchemaSearch,
            [setSelectedTables, setSelectedColumns]
          )}
  
          {renderSearchableSelect(
            'Table',
            filteredTables,
            selectedTables,
            setSelectedTables,
            tableSearch,
            setTableSearch,
            [setSelectedColumns]
          )}
  
          {renderSearchableSelect(
            'Column',
            filteredColumns,
            selectedColumns,
            setSelectedColumns,
            columnSearch,
            setColumnSearch
          )}
  
        </div>
      </Box>
    );
  };
  
  export default Step3;
  