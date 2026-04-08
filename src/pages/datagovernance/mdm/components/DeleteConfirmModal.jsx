const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting, title, message, note }) => {
    if (!isOpen) return null;

    return (
        <>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        minWidth: '400px',
                        maxWidth: '480px',
                        boxShadow: '0px 20px 60px rgba(0,0,0,0.2)',
                        position: 'relative',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className='p-6'>

                        <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#332849', marginBottom: '12px' }}>
                            {title}
                        </h2>

                        <p className='pt-3' style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                            {message}
                        </p>

                        {/* Note — shown only when passed */}
                        {note && (
                            <p style={{
                                marginTop: '12px',
                                padding: '10px 12px',
                                backgroundColor: '#FFF7ED',
                                border: '1px solid #FED7AA',
                                borderRadius: '8px',
                                fontSize: '13px',
                                color: '#92400E',
                                lineHeight: '1.5',
                            }}>
                                <strong>Note:</strong> {note}
                            </p>
                        )}

                    </div>
                    {/* Actions */}
                    <div className='px-5 py-4' style={{
                        display: 'flex', justifyContent: 'flex-end', gap: '12px', boxShadow: '0px -4px 9px 0px #0000001A'
                    }}>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            style={{
                                padding: '8px 20px', borderRadius: '8px',
                                border: '1px solid #818181',
                                backgroundColor: '#fff', color: '#818181',
                                fontSize: '14px', fontWeight: 500,
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.6 : 1,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            style={{
                                padding: '8px 20px', borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#EF4D5F', color: '#fff',
                                fontSize: '14px', fontWeight: 500,
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeleteConfirmModal