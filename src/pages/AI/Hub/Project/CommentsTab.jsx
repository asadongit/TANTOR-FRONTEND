// tabs/CommentsTab.jsx
import { Search, EllipsisVertical } from 'lucide-react';
import DataTable from '../../../../components/DataTable';

const CommentsTab = () => {
    const commentsData = [
        { sno: 1, component: 'Data Upload', subject: 'CSV file validation issue', post_date: '01/02/2025', last_date: '03/10/2025', pins: '---' },
        { sno: 2, component: 'User Registration', subject: 'Email verification pending', post_date: '02/10/2025', last_date: '04/10/2025', pins: '---' },
        { sno: 3, component: 'Payment Processing', subject: 'Payment gateway timeout', post_date: '03/10/2025', last_date: '05/10/2025', pins: '---' },
        { sno: 4, component: 'Account Setup', subject: 'Incomplete profile information', post_date: '04/10/2025', last_date: '06/10/2025', pins: '---' },
        { sno: 5, component: 'Feature Deployment', subject: 'New feature rollout delayed', post_date: '05/10/2025', last_date: '07/10/2025', pins: '---' },
        { sno: 6, component: 'System Maintenance', subject: 'Scheduled downtime', post_date: '06/10/2025', last_date: '08/10/2025', pins: '---' },
        { sno: 7, component: 'Data Backup', subject: 'Backup failure', post_date: '07/10/2025', last_date: '09/10/2025', pins: '---' },
        { sno: 8, component: 'Security Audit', subject: 'Vulnerability detected', post_date: '08/10/2025', last_date: '10/10/2025', pins: '---' },
        { sno: 9, component: 'Software Update', subject: 'Update installation error', post_date: '09/10/2025', last_date: '11/10/2025', pins: '---' }
    ];


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
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm  min-w-[160px]"
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

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Sort by</label>
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]">
                            <option>Date</option>
                            <option>Component</option>
                            <option>Subject</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Comments"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-[#8e78b7] text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap">
                        + Comment
                    </button>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <EllipsisVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <DataTable
                columns={[
                    { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                    { key: 'component', label: 'Component', sortable: true },
                    { key: 'subject', label: 'Subject', sortable: true },
                    { key: 'post_date', label: 'Post Date', sortable: true },
                    { key: 'last_date', label: 'Last Date', sortable: true },
                    { key: 'pins', label: 'Pins', sortable: true },
                ]}
                data={commentsData}
                actions={[]}
                isLoading={false}
                isError={false}
            />
        </>
    );
};

export default CommentsTab;