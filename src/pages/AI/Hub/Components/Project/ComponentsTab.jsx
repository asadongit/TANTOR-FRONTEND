import { ChevronDown, ChevronRight, Search, BookOpen, Gauge, Palette, Archive, Trash2, Rocket, Sparkles } from "lucide-react"
import DataTable from "../../../../../components/DataTable"
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ComponentsTab = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        datasets: false,
        models: false,
        notebook: false
    });
    const [selectedModel, setSelectedModel] = useState(null);
    const [isQuickPredictOpen, setIsQuickPredictOpen] = useState(false);

    const datasetsData = [
        { sno: 1, name: 'Project - Churn', description: 'Churn', created_date: '01/10/2025', size: '23 MB', rows: 23, features: 'Swifts' },
        { sno: 2, name: 'Project - Analysis', description: 'Churn', created_date: '01/10/2025', size: '23 MB', rows: 23, features: 'Swifts' },
        { sno: 3, name: 'Project - Retention', description: 'Retention', created_date: '15/10/2025', size: '23 MB', rows: 23, features: 'Mekong' },
        { sno: 4, name: 'Project - Acquisition', description: 'Acquisition', created_date: '01/12/2025', size: '23 MB', rows: 23, features: 'Amazon' },
        { sno: 5, name: 'Project - Engagement', description: 'Engagement', created_date: '20/12/2025', size: '23 MB', rows: 23, features: 'Nile' },
        { sno: 6, name: 'Project - Onboarding', description: 'Onboarding', created_date: '05/01/2025', size: '23 MB', rows: 23, features: 'Yangtze' },
        { sno: 7, name: 'Project - Feedback', description: 'Feedback', created_date: '30/01/2025', size: '23 MB', rows: 23, features: 'Danube' },
        { sno: 8, name: 'Project - Analysis', description: 'Analysis', created_date: '15/02/2025', size: '23 MB', rows: 23, features: 'Thames' },
        { sno: 9, name: 'Project - Strategy', description: 'Strategy', created_date: '01/03/2025', size: '23 MB', rows: 23, features: 'Seine' }
    ];

    const modelsData = [
        { sno: 1, name: 'Model - Churn Predictor', description: 'Predict customer churn', created_date: '05/10/2025', accuracy: '92%', type: 'Classification' },
        { sno: 2, name: 'Model - Sentiment Analysis', description: 'Analyze customer sentiment', created_date: '10/10/2025', accuracy: '88%', type: 'NLP' },
        { sno: 3, name: 'Model - Recommendation', description: 'Product recommendations', created_date: '20/10/2025', accuracy: '85%', type: 'Collaborative Filtering' },
        { sno: 4, name: 'Model - Fraud Detection', description: 'Detect fraudulent transactions', created_date: '25/10/2025', accuracy: '94%', type: 'Anomaly Detection' },
        { sno: 5, name: 'Model - Price Optimization', description: 'Optimize pricing strategy', created_date: '01/11/2025', accuracy: '89%', type: 'Regression' },
        { sno: 6, name: 'Model - Customer Segmentation', description: 'Segment customers by behavior', created_date: '10/11/2025', accuracy: '91%', type: 'Clustering' },
        { sno: 7, name: 'Model - Demand Forecasting', description: 'Forecast product demand', created_date: '15/11/2025', accuracy: '87%', type: 'Time Series' },
        { sno: 8, name: 'Model - Image Classification', description: 'Classify product images', created_date: '20/11/2025', accuracy: '93%', type: 'Deep Learning' },
        { sno: 9, name: 'Model - Text Summarization', description: 'Summarize customer reviews', created_date: '25/11/2025', accuracy: '86%', type: 'NLP' },
        { sno: 10, name: 'Model - Click Prediction', description: 'Predict ad click probability', created_date: '01/12/2025', accuracy: '90%', type: 'Classification' }
    ];

    const notebookData = [
        { sno: 1, name: 'EDA - Customer Analysis', description: 'Exploratory data analysis', created_date: '02/10/2025', last_run: '05/10/2025', status: 'Completed' },
        { sno: 2, name: 'Feature Engineering', description: 'Feature creation and selection', created_date: '08/10/2025', last_run: '10/10/2025', status: 'In Progress' },
        { sno: 3, name: 'Model Training', description: 'Train and validate models', created_date: '15/10/2025', last_run: '18/10/2025', status: 'Completed' },
        { sno: 4, name: 'Data Cleaning', description: 'Clean and preprocess data', created_date: '20/10/2025', last_run: '22/10/2025', status: 'Completed' },
        { sno: 5, name: 'Hyperparameter Tuning', description: 'Optimize model parameters', created_date: '25/10/2025', last_run: '28/10/2025', status: 'Failed' },
        { sno: 6, name: 'Model Evaluation', description: 'Evaluate model performance', created_date: '01/11/2025', last_run: '03/11/2025', status: 'Completed' },
        { sno: 7, name: 'Data Visualization', description: 'Create visualizations', created_date: '05/11/2025', last_run: '07/11/2025', status: 'Completed' },
        { sno: 8, name: 'A/B Testing Analysis', description: 'Analyze A/B test results', created_date: '10/11/2025', last_run: '12/11/2025', status: 'In Progress' },
        { sno: 9, name: 'Model Deployment', description: 'Deploy model to production', created_date: '15/11/2025', last_run: '17/11/2025', status: 'Pending' },
        { sno: 10, name: 'Performance Monitoring', description: 'Monitor model performance', created_date: '20/11/2025', last_run: '22/11/2025', status: 'Active' }
    ];

    // Dataset actions
    const datasetActions = [
        {
            label: 'Library',
            icon: <BookOpen className="w-4 h-4" />,
            onClick: (row) => {
                navigate(`/ai/hub/data/library/${row.name}`, {
                    state: { datasetData: row }
                });
            },
            tooltip: 'Library',
        },
        {
            label: 'F1 Mode',
            icon: <Gauge className="w-4 h-4" />,
            onClick: (row) => console.log('F1 Mode:', row),
            tooltip: 'F1 Mode',
        },
        {
            label: 'AI Canvas',
            icon: <Palette className="w-4 h-4" />,
            onClick: (row) => console.log('AI Canvas:', row),
            tooltip: 'AI Canvas',
        },
        {
            label: 'Archive',
            icon: <Archive className="w-4 h-4" />,
            onClick: (row) => console.log('Archive:', row),
            tooltip: 'Archive',
        },
        {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: (row) => console.log('Delete:', row),
            tooltip: 'Delete',
        },
    ];

    // Model actions
    const modelActions = [
        {
            label: "Library",
            icon: <BookOpen className="w-4 h-4" />,
            onClick: (row) =>
                navigate("/ai/hub/models/library", { state: { modelData: row } }),
            tooltip: "Library",
        },
        {
            label: "F1 Mode",
            icon: <Gauge className="w-4 h-4" />,
            onClick: (row) => console.log("F1 Mode:", row),
            tooltip: "F1 Mode",
        },
        {
            label: "AI Canvas",
            icon: <Palette className="w-4 h-4" />,
            onClick: (row) =>
                navigate("/ai/playground/model-genesis", {
                    state: {
                        mode: "view",
                        model: row,
                    },
                }),
            tooltip: "AI Canvas",
        },
        {
            label: "Deploy",
            icon: <Rocket className="w-4 h-4" />,
            onClick: (row) => console.log("Deploy:", row),
            tooltip: "Deploy",
        },
        {
            label: "Archive",
            icon: <Archive className="w-4 h-4" />,
            onClick: (row) => console.log("Archive:", row),
            tooltip: "Archive",
        },
        {
            label: "Quick Predict",
            icon: <Sparkles className="w-4 h-4" />,
            onClick: (row) => {
                setSelectedModel(row);
                setIsQuickPredictOpen(true);
            },
            tooltip: "Quick Predict",
        },
        {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: (row) => console.log("Delete:", row),
            tooltip: "Delete",
        },
    ];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="space-y-4">
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Components"
                    className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    onClick={() => toggleSection('datasets')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="w-full flex items-center justify-between">
                        <span className="text-base font-medium text-[#8e78b7]">
                            Datasets ({datasetsData.length})
                        </span>
                        {expandedSections.datasets ? (
                            <ChevronDown className="w-5 h-5 text-[#8e78b7]" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>
                {expandedSections.datasets && (
                    <div className="px-4 pb-4">
                        <DataTable
                            columns={[
                                { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                {
                                    key: 'name',
                                    label: 'Name',
                                    sortable: true,
                                    render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.name}</span>,
                                },
                                { key: 'description', label: 'Description', sortable: true },
                                { key: 'created_date', label: 'Created Date', sortable: true },
                                { key: 'size', label: 'Size', sortable: true },
                                { key: 'rows', label: 'Rows', sortable: true },
                                { key: 'features', label: 'Features', sortable: true },
                                { label: 'Action', sortable: false, width: '100px' },
                            ]}
                            data={datasetsData}
                            actions={datasetActions}
                            isLoading={false}
                            isError={false}
                        />
                    </div>
                )}
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    onClick={() => toggleSection('models')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="w-full flex items-center justify-between">
                        <span className="text-base font-medium text-[#8e78b7]">
                            Models ({modelsData.length})
                        </span>
                        {expandedSections.models ? (
                            <ChevronDown className="w-5 h-5 text-[#8e78b7]" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>
                {expandedSections.models && (
                    <div className="px-4 pb-4">
                        <DataTable
                            columns={[
                                { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                {
                                    key: 'name',
                                    label: 'Name',
                                    sortable: true,
                                    render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.name}</span>,
                                },
                                { key: 'description', label: 'Description', sortable: true },
                                { key: 'created_date', label: 'Created Date', sortable: true },
                                { key: 'accuracy', label: 'Accuracy', sortable: true },
                                { key: 'type', label: 'Type', sortable: true },
                                { label: 'Action', sortable: false, width: '100px' },
                            ]}
                            data={modelsData}
                            actions={modelActions}
                            isLoading={false}
                            isError={false}
                        />
                    </div>
                )}
            </div>

            <div className="border border-gray-200 rounded-lg">
                <button
                    onClick={() => toggleSection('notebook')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="w-full flex items-center justify-between">
                        <span className="text-base font-medium text-[#8e78b7]">
                            Notebook ({notebookData.length})
                        </span>
                        {expandedSections.notebook ? (
                            <ChevronDown className="w-5 h-5 text-[#8e78b7]" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                </button>
                {expandedSections.notebook && (
                    <div className="px-4 pb-4">
                        <DataTable
                            columns={[
                                { key: 'sno', label: 'Sno', sortable: true, width: '80px' },
                                {
                                    key: 'name',
                                    label: 'Name',
                                    sortable: true,
                                    render: (row) => <span className="text-[#8e78b7] hover:underline cursor-pointer">{row.name}</span>,
                                },
                                { key: 'description', label: 'Description', sortable: true },
                                { key: 'created_date', label: 'Created Date', sortable: true },
                                { key: 'last_run', label: 'Last Run', sortable: true },
                                { key: 'status', label: 'Status', sortable: true },
                            ]}
                            data={notebookData}
                            actions={[]}
                            isLoading={false}
                            isError={false}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
export default ComponentsTab