
import { Stepper, Step, StepLabel, Button, Box, Typography } from '@mui/material';
const Step3 = ({name}) =>{
return (
    <Box>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">{name}</h3>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none">
                                        <option value="">Select</option>
                                        <option value="conn1">Connection 1</option>
                                        <option value="conn2">Connection 2</option>
                                        <option value="conn3">Connection 3</option>
                                        <option value="conn4">Connection 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none">
                                        <option value="">Select</option>
                                        <option value="schema1">Schema 1</option>
                                        <option value="schema2">Schema 2</option>
                                        <option value="schema3">Schema 3</option>
                                        <option value="schema4">Schema 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none">
                                        <option value="">Select</option>
                                        <option value="table1">Table 1</option>
                                        <option value="table2">Table 2</option>
                                        <option value="table3">Table 3</option>
                                        <option value="table4">Table 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none">
                                        <option value="">Select</option>
                                        <option value="col1">Column 1</option>
                                        <option value="col2">Column 2</option>
                                        <option value="col3">Column 3</option>
                                        <option value="col4">Column 4</option>
                                    </select>
                                </div>
                            </div>
                        </Box>
)
}

export default Step3