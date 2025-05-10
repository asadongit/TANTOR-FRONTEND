import React, { useState, useEffect } from 'react';
import { ChevronLeft, XCircle, CheckCircle } from 'lucide-react';

const TimeTransformationComponent = ({isOpen, setIsOpen}) => {
    const [dateType, setDateType] = useState('asOnDate');
    const [lowerOffset, setLowerOffset] = useState('');
    const [upperOffset, setUpperOffset] = useState('');
    const [lowerUnit, setLowerUnit] = useState('');
    const [upperUnit, setUpperUnit] = useState('');

    const handleValidate = () => {
        console.log('Validating:', { dateType, lowerOffset, lowerUnit, upperOffset, upperUnit });
        alert('Validation logic not implemented. Check console for values.');
    };

    // Modal close handler
    const handleClose = () => {
        setIsOpen(false);
    };

    // UseEffect to prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);



    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl relative z-50">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Time Transformation</h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label="Close"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4 space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="asOnDate"
                                    value="asOnDate"
                                    checked={dateType === 'asOnDate'}
                                    onChange={() => setDateType('asOnDate')}
                                    className="mr-2"
                                />
                                <label htmlFor="asOnDate" className="text-[#6c757d] font-medium">As on Date</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="historicDate"
                                    value="historicDate"
                                    checked={dateType === 'historicDate'}
                                    onChange={() => setDateType('historicDate')}
                                    className="mr-2"

                                />
                                <label htmlFor="historicDate" className="text-[#6c757d] font-medium">Historic Date</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="dateRange"
                                    value="dateRange"
                                    checked={dateType === 'dateRange'}
                                    onChange={() => setDateType('dateRange')}
                                    className="mr-2"
                                />
                                <label htmlFor="dateRange" className="text-[#6c757d] font-medium">Date Range</label>
                            </div>
                        </div>

                        {(dateType === 'historicDate' || dateType === 'dateRange') && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="lowerOffset" className="block text-sm font-medium text-[#6c757d]">
                                        Lower Offset
                                    </label>
                                    <input
                                        id="lowerOffset"
                                        type="number"
                                        value={lowerOffset}
                                        onChange={(e) => setLowerOffset(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                                        disabled={dateType === 'asOnDate'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lowerUnit" className="block text-sm font-medium text-[#6c757d]">
                                        Unit
                                    </label>
                                    <select
                                        value={lowerUnit}
                                        onChange={(e) => setLowerUnit(e.target.value)}
                                        disabled={dateType === 'asOnDate'}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                                    >
                                        <option value="">Select unit</option>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {dateType === 'dateRange' && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="upperOffset" className="block text-sm font-medium text-[#6c757d]">
                                        Upper Offset
                                    </label>
                                    <input
                                        id="upperOffset"
                                        type="number"
                                        value={upperOffset}
                                        onChange={(e) => setUpperOffset(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="upperUnit" className="block text-sm font-medium text-[#6c757d]">
                                        Unit
                                    </label>
                                    <select
                                        value={upperUnit}
                                        onChange={(e) => setUpperUnit(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent"
                                    >
                                        <option value="">Select unit</option>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                type="button"
                                className="text-[#6c757d] hover:text-black flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent transition-colors duration-200"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                type="button"
                                className="text-[#6c757d] hover:text-black flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:border-transparent transition-colors duration-200"
                            >
                                <XCircle className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                type="button"
                                className="bg-[#8E77BB] text-white hover:bg-[#7864a3] flex items-center gap-2 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:ring-opacity-50 transition-colors duration-200"
                                onClick={handleValidate}
                            >
                                <CheckCircle className="w-4 h-4" /> Validate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TimeTransformationComponent;

{/* <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <TimeTransformation />
</div> */}