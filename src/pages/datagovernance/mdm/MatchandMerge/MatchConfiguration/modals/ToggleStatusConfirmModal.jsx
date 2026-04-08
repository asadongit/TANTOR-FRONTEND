import React from 'react';

const ToggleStatusConfirmModal = ({ isOpen, ruleName, currentStatus, onConfirm, onCancel, isLoading }) => {
    if (!isOpen) return null;
    const isActive = currentStatus?.toLowerCase() === 'active';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-[10000]"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] bg-white rounded-2xl p-7 w-[360px] shadow-[0px_20px_50px_rgba(0,0,0,0.15)]">
                <h3 className="text-base font-semibold text-[#282F49] mb-1.5">
                    {isActive ? 'Disable Rule' : 'Enable Rule'}
                </h3>

                <p className="text-[13px] text-[#818181] mb-6 leading-relaxed">
                    Are you sure you want to {isActive ? 'disable' : 'enable'} the rule{' '}
                    <span className="text-[#332849] font-medium">"{ruleName}"</span>?
                </p>

                <div className="flex gap-2.5">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[#332849] text-[13px] font-medium cursor-pointer hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={[
                            'flex-1 py-2.5 rounded-[10px] border-none text-white text-[13px] font-medium transition-colors',
                            isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
                            isActive
                                ? 'bg-[#EF4D5F] hover:bg-[#d93f50]'
                                : 'bg-[#069B68] hover:bg-[#057a53]',
                        ].join(' ')}
                    >
                        {isLoading
                            ? (isActive ? 'Disabling...' : 'Enabling...')
                            : (isActive ? 'Disable' : 'Enable')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ToggleStatusConfirmModal;