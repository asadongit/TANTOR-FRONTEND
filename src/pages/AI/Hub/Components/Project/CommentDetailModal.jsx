import { X, Send } from 'lucide-react';
import { useState, useEffect } from 'react';

const CommentDetailModal = ({ isOpen, onClose, selectedRow, replyText, onReplyChange, onSendReply }) => {
    const [mentionedUser, setMentionedUser] = useState(null);

    useEffect(() => {
        if (selectedRow && selectedRow.thread && selectedRow.thread.length > 0) {
            setMentionedUser(selectedRow.thread[0].userName);
        }
    }, [selectedRow]);

    if (!isOpen || !selectedRow) return null;

    const handleSendReply = () => {
        if (replyText.trim()) {
            onSendReply();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };

    const handleRemoveMention = () => {
        setMentionedUser(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-end z-50">
            <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Project - {selectedRow.componentName}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {selectedRow.totalReplies < 10 ? '0' : ''}{selectedRow.totalReplies} Total Replies
                        </span>
                        {selectedRow.newComments > 0 && (
                            <span className="text-sm text-gray-500">
                                • {selectedRow.newComments} new comments
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Subject and Data Info */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-gray-600">Subject : </span>
                            <span className="text-sm text-gray-900">{selectedRow.fullSubject}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Data : </span>
                            <span className="text-sm text-gray-900">{selectedRow.data}</span>
                        </div>
                    </div>
                </div>

                {/* Comments Thread */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {selectedRow.thread && selectedRow.thread.length > 0 ? (
                        <div className="space-y-4">
                            {selectedRow.thread.map((comment, index) => (
                                <div key={index}>
                                    {index === 0 ? (
                                        /* Top Comment - Full Width */
                                        <div className="flex gap-3 bg-white">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                                    {comment.initial}
                                                </div>
                                            </div>

                                            {/* Comment Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {comment.userName}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {comment.date}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    {comment.message}
                                                </p>
                                                {comment.repliesCount && (
                                                    <button className="text-xs text-[#8e78b7] mt-2 hover:text-[#7d6ba3]">
                                                        {comment.repliesCount} replies
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Reply Comments - With Border and Background */
                                        <div className="ml-6 border-l-2 border-gray-200 pl-4">
                                            <div className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs">
                                                        {comment.initial}
                                                    </div>
                                                </div>

                                                {/* Comment Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-1">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {comment.userName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            {comment.date}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">
                                                        {comment.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            No comments yet
                        </div>
                    )}
                </div>

                {/* Reply Input at Bottom */}
                <div className="px-6 py-4 bg-[#f8f7fc] border-t border-gray-200">
                    {mentionedUser && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[#8e78b7] text-xs font-medium px-2 py-1 bg-white rounded-md border border-gray-200">
                                @{mentionedUser}
                                <button
                                    onClick={handleRemoveMention}
                                    className="ml-1 text-gray-400 hover:text-gray-600"
                                >
                                </button>
                            </span>
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => onReplyChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add Reply"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e78b7] pr-10"
                        />
                        <button
                            onClick={handleSendReply}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8e78b7] hover:text-[#7d6ba3] transition-colors disabled:opacity-30"
                            disabled={!replyText.trim()}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentDetailModal;