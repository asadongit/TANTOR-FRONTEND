import { useState } from 'react';
import { Search, Pin } from 'lucide-react';
import DataTable from '../../../../../components/DataTable';
import AddCommentModal from './AddCommentModal';
import CommentDetailModal from './CommentDetailModal';

const CommentsTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSideModalOpen, setIsSideModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [formData, setFormData] = useState({
        componentType: '',
        componentName: '',
        category: '',
        subject: '',
        comment: ''
    });
    const [pinnedComments, setPinnedComments] = useState(new Set());

    const commentsData = [
        {
            sno: 1,
            userName: 'Oliver',
            componentType: 'Data Upload',
            componentName: 'Data Upload',
            subject: 'CSV file validation iss...',
            fullSubject: 'CSV file validation issue',
            comment: 'CSV file validation iss...',
            fullComment: 'CSV file validation issue',
            postDate: '02/10/2025',
            lastDate: '04/10/2025',
            pins: '---',
            replies: '12 Replies',
            totalReplies: 5,
            newComments: 3,
            data: 'Data.CSV',
            thread: [
                {
                    userName: 'Jacob Jones',
                    initial: 'J',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'The updated CSV has been uploaded. Please confirm if the validation passes now.',
                    repliesCount: 5
                },
                {
                    userName: 'Brooklyn Simmons',
                    initial: 'B',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'Thanks for confirming. Closing this thread from our side.'
                },
                {
                    userName: 'Jacob Jones',
                    initial: 'J',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'Appreciate the quick turnaround on this.'
                },
                {
                    userName: 'Cameron Williamson',
                    initial: 'C',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'Noted. Please reach out if the issue reoccurs.'
                },
                {
                    userName: 'Leslie Alexander',
                    initial: 'L',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'Marking this as resolved and archived for reference.'
                },
                {
                    userName: 'Courtney Henry',
                    initial: 'C',
                    date: '22 Aug 2022 at 12:00 PM',
                    message: 'All good now. No further action required.'
                }
            ]
        },
        {
            sno: 2,
            userName: 'Sophia',
            componentType: 'User Registration',
            componentName: 'User Registration',
            subject: 'Email verification pen...',
            fullSubject: 'Email verification pending',
            comment: 'Email verification pen...',
            fullComment: 'Email verification pending',
            postDate: '02/10/2025',
            lastDate: '04/10/2025',
            pins: '---',
            replies: '12 Replies',
            totalReplies: 8,
            newComments: 2,
            data: 'User.CSV',
            thread: [
                {
                    userName: 'John Doe',
                    initial: 'J',
                    date: '23 Aug 2022 at 10:00 AM',
                    message: 'Working on the email verification issue.'
                }
            ]
        },
        {
            sno: 3,
            userName: 'Liam',
            componentType: 'Payment Processing',
            componentName: 'Payment Processing',
            subject: 'Payment gateway tim...',
            fullSubject: 'Payment gateway timeout',
            comment: 'Payment gateway tim...',
            fullComment: 'Payment gateway timeout',
            postDate: '03/10/2025',
            lastDate: '05/10/2025',
            pins: '---',
            replies: '08 Replies',
            totalReplies: 8,
            newComments: 1,
            data: 'Payment.CSV',
            thread: []
        },
        {
            sno: 4,
            userName: 'Ava',
            componentType: 'Account Setup',
            componentName: 'Account Setup',
            subject: 'Incomplete profile inf...',
            fullSubject: 'Incomplete profile information',
            comment: 'Incomplete profile inf...',
            fullComment: 'Incomplete profile information',
            postDate: '04/10/2025',
            lastDate: '06/10/2025',
            pins: '---',
            replies: '23 Replies',
            totalReplies: 23,
            newComments: 5,
            data: 'Account.CSV',
            thread: []
        },
        {
            sno: 5,
            userName: 'Noah',
            componentType: 'Feature Deployment',
            componentName: 'Feature Deployment',
            subject: 'New feature rollout d...',
            fullSubject: 'New feature rollout delayed',
            comment: 'New feature rollout d...',
            fullComment: 'New feature rollout delayed',
            postDate: '05/10/2025',
            lastDate: '07/10/2025',
            pins: '---',
            replies: '05 Replies',
            totalReplies: 5,
            newComments: 0,
            data: 'Feature.CSV',
            thread: []
        },
        {
            sno: 6,
            userName: 'Liam',
            componentType: 'System Maintenance',
            componentName: 'System Maintenance',
            subject: 'Scheduled downtime',
            fullSubject: 'Scheduled downtime',
            comment: 'Scheduled downtime',
            fullComment: 'Scheduled downtime',
            postDate: '06/10/2025',
            lastDate: '08/10/2025',
            pins: '---',
            replies: '09 Replies',
            totalReplies: 9,
            newComments: 2,
            data: 'System.CSV',
            thread: []
        },
        {
            sno: 7,
            userName: 'Ethan',
            componentType: 'Data Backup',
            componentName: 'Data Backup',
            subject: 'Backup failure',
            fullSubject: 'Backup failure',
            comment: 'Backup failure',
            fullComment: 'Backup failure',
            postDate: '07/10/2025',
            lastDate: '09/10/2025',
            pins: '---',
            replies: '12 Replies',
            totalReplies: 12,
            newComments: 3,
            data: 'Backup.CSV',
            thread: []
        },
        {
            sno: 8,
            userName: 'Isabella',
            componentType: 'Security Audit',
            componentName: 'Security Audit',
            subject: 'Vulnerability detected',
            fullSubject: 'Vulnerability detected',
            comment: 'Vulnerability detected',
            fullComment: 'Vulnerability detected',
            postDate: '08/10/2025',
            lastDate: '10/10/2025',
            pins: '---',
            replies: '16 Replies',
            totalReplies: 16,
            newComments: 4,
            data: 'Security.CSV',
            thread: []
        },
        {
            sno: 9,
            userName: 'Lucas',
            componentType: 'Software Update',
            componentName: 'Software Update',
            subject: 'Update installation er...',
            fullSubject: 'Update installation error',
            comment: 'Update installation er...',
            fullComment: 'Update installation error',
            postDate: '09/10/2025',
            lastDate: '11/10/2025',
            pins: '---',
            replies: '05 Replies',
            totalReplies: 5,
            newComments: 0,
            data: 'Update.CSV',
            thread: []
        }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        setIsModalOpen(false);
        setFormData({
            componentType: '',
            componentName: '',
            category: '',
            subject: '',
            comment: ''
        });
    };

    const handleReset = () => {
        setFormData({
            componentType: '',
            componentName: '',
            category: '',
            subject: '',
            comment: ''
        });
    };

    const handleRowClick = (row) => {
        setSelectedRow(row);
        setIsSideModalOpen(true);
    };

    const handleCloseSideModal = () => {
        setIsSideModalOpen(false);
        setSelectedRow(null);
        setReplyText('');
    };

    const handleSendReply = () => {
        console.log('Reply sent:', replyText);
        // Add logic to send reply
        setReplyText('');
    };

    const handleTogglePin = (row, e) => {
        e.stopPropagation();
        
        setPinnedComments(prev => {
            const newPinned = new Set(prev);
            if (newPinned.has(row.sno)) {
                newPinned.delete(row.sno);
                console.log('Unpinned comment:', row.sno);
            } else {
                newPinned.add(row.sno);
                console.log('Pinned comment:', row.sno);
            }
            return newPinned;
        });
    };

    return (
        <>
            <div className="flex items-end mb-6 justify-between">
                <div className="flex items-end gap-3">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Component</label>
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px]">
                            <option>Component 1</option>
                            <option>Data Upload</option>
                            <option>User Registration</option>
                            <option>Payment Processing</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            defaultValue="2025-01-02"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[160px]"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            defaultValue="2025-01-02"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[160px]"
                        />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Comments"
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[400px]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-[#7d6ba3] transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
                    >
                        + Comment
                    </button>
                </div>
            </div>

            <DataTable
                columns={[
                    { key: 'userName', label: 'User Name', sortable: true, width: '120px' },
                    { 
                        key: 'componentType', 
                        label: 'Component Type', 
                        sortable: true,
                        render: (row) => (
                            <span className="text-[#8e78b7] underline cursor-pointer hover:text-[#7d6ba3]">
                                {row.componentType}
                            </span>
                        )
                    },
                    { key: 'componentName', label: 'Component Name', sortable: true },
                    { key: 'subject', label: 'Subject', sortable: true },
                    { key: 'comment', label: 'Comment', sortable: true },
                    { key: 'postDate', label: 'Post Date', sortable: true },
                    { key: 'lastDate', label: 'Last Date', sortable: true },
                    { key: 'pins', label: 'Pins', sortable: true },
                    { 
                        key: 'replies', 
                        label: '', 
                        sortable: false,
                        render: (row) => (
                            <span className="text-[#8e78b7] cursor-pointer hover:text-[#7d6ba3]">
                                {row.replies}
                            </span>
                        )
                    },
                    {
                        key: 'pinAction',
                        label: '',
                        sortable: false,
                        width: '80px',
                        render: (row) => (
                            <div className="flex justify-center">
                                <button
                                    onClick={(e) => handleTogglePin(row, e)}
                                    className={`p-2 rounded-full transition-all duration-200 ${
                                        pinnedComments.has(row.sno)
                                            ? 'text-[#8e78b7] bg-[#f3f0f8] hover:bg-[#e8e3f0]'
                                            : 'text-gray-400 hover:text-[#8e78b7] hover:bg-gray-100'
                                    }`}
                                    title={pinnedComments.has(row.sno) ? 'Unpin comment' : 'Pin comment'}
                                    aria-label={pinnedComments.has(row.sno) ? 'Unpin comment' : 'Pin comment'}
                                >
                                    <Pin 
                                        size={18} 
                                        className={`transition-transform duration-200 ${
                                            pinnedComments.has(row.sno) ? 'fill-current' : ''
                                        }`}
                                    />
                                </button>
                            </div>
                        )
                    }
                ]}
                data={commentsData}
                isLoading={false}
                isError={false}
                onRowClick={handleRowClick}
                selectedRowId={selectedRow?.sno}
            />

            {/* Add Comment Modal */}
            <AddCommentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onReset={handleReset}
            />

            {/* Comment Detail Side Modal */}
            <CommentDetailModal
                isOpen={isSideModalOpen}
                onClose={handleCloseSideModal}
                selectedRow={selectedRow}
                replyText={replyText}
                onReplyChange={setReplyText}
                onSendReply={handleSendReply}
            />
        </>
    );
};

export default CommentsTab;