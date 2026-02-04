import { X, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link as LinkIcon, Play, Send } from 'lucide-react';

const AddCommentModal = ({ isOpen, onClose, formData, onInputChange, onSubmit, onReset, error }) => {
    if (!isOpen) return null;

    const handleSubjectChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[^a-zA-Z0-9\s\/\-]/g, '');
        onInputChange({ target: { name: 'subject', value } });
    };

    const handleCancel = () => {
        onReset();
        onClose();
    };

    const handleSubmit = () => {
        onSubmit();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Add Comment</h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Component Type */}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1.5">Component Type</label>
                            <select
                                name="componentType"
                                value={formData.componentType}
                                onChange={onInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select</option>
                                <option value="feature">Feature</option>
                                <option value="bug">Bug</option>
                                <option value="enhancement">Enhancement</option>
                            </select>
                        </div>

                        {/* Component Name */}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1.5">Component Name</label>
                            <select
                                name="componentName"
                                value={formData.componentName}
                                onChange={onInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select</option>
                                <option value="data-upload">Data Upload</option>
                                <option value="user-registration">User Registration</option>
                                <option value="payment-processing">Payment Processing</option>
                                <option value="account-setup">Account Setup</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1.5">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={onInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select</option>
                                <option value="technical">Technical</option>
                                <option value="business">Business</option>
                                <option value="design">Design</option>
                            </select>
                        </div>

                        {/* Subject */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm text-gray-700">Subject</label>
                                <span className="text-xs text-gray-500">
                                    {formData.subject?.length || 0}/120
                                </span>
                            </div>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleSubjectChange}
                                placeholder="Subject"
                                maxLength="120"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Add Comment Text Area */}
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm text-gray-700">Add Comment</label>
                            <span className="text-xs text-gray-500">
                                {formData.comment?.length || 0}/500
                            </span>
                        </div>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                            {/* Text Area */}
                            <textarea
                                name="comment"
                                value={formData.comment}
                                onChange={onInputChange}
                                rows="6"
                                maxLength="500"
                                className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
                            ></textarea>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm text-white bg-[#8e78b7] rounded-lg hover:bg-[#7d6ba3] transition-colors flex items-center gap-2"
                    >
                        Post
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCommentModal;