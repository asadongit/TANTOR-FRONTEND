import React, { createContext, useState, useContext } from 'react';
import { X } from 'lucide-react';
import { Icon } from "@iconify/react";

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    React.useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.show && (
                <div
                    className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn ${toast.type === "success"
                            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                            : "bg-red-100 text-red-800 border-l-4 border-red-500"
                        }`}
                >
                    <Icon
                        icon={toast.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
                        className="h-5 w-5"
                    />
                    <p>{toast.message}</p>
                    <button
                        onClick={() => setToast({ show: false, message: "", type: "" })}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}