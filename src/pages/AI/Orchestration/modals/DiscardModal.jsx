
import { ChevronLeft, Calendar, X } from 'lucide-react';
import { useState } from 'react';

const DiscardModal = ({ isOpen, onDiscard, onStay }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Discard schedule setup?</h2>
                    <button onClick={onStay} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-600">
                        You have unsaved changes. If you go back now, your schedule configuration will be lost.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                    <button 
                        onClick={onDiscard}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded transition-colors"
                    >
                        Discard & go back
                    </button>
                    <button 
                        onClick={onStay}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] hover:bg-[#7d68a6] rounded transition-colors"
                    >
                        Stay on this page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscardModal