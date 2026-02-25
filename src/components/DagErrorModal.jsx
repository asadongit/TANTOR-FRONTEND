import { X, Loader } from "lucide-react";
import { Icon } from "@iconify-icon/react";

export const DagErrorModal = ({ isOpen, onClose, isLoading, data }) => {
    if (!isOpen) return null;

    console.log("data ==> ", data);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[900px] max-h-[80vh] flex flex-col p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Icon icon="material-symbols:error-outline" className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-semibold text-gray-800">DAG Failure Details</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-600">Fetching failure details...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-3">
                            {data.status && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-500 w-28">Status:</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${data.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                        }`}>{data.status}</span>
                                </div>
                            )}

                            {(data.error || data.error_message) && (
                                <div className="mt-3">
                                    <span className="text-sm font-semibold text-gray-500">Error Log:</span>
                                    <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-800 whitespace-pre-wrap break-all max-h-[350px] overflow-y-auto">
                                        {data.error || data.error_message}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No failure data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};