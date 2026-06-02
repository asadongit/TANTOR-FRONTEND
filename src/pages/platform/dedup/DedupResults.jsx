import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Search, X, Eye, ShieldAlert, CheckCircle2, UserCheck, Shield, SlidersHorizontal, Download } from 'lucide-react';
import DataTable from '../../../components/DataTable.jsx';
import Breadcrumb from '../../../components/Breadcrumb.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';

import CaptivePortalIcon from '../../../assets/mdm/captive_portal.svg';
import CDCIcon from '../../../assets/mdm/CDC.svg';
import ComplianceIcon from '../../../assets/mdm/Compliance.svg';
import LinkedServicesIcon from '../../../assets/mdm/linked_services.svg';

const allColumnDefinitions = {
    registry_id: {
        key: 'registry_id',
        label: 'Registry Id',
        render: (row) => <span className="font-semibold text-gray-800 text-sm">{row.registry_id !== null && row.registry_id !== undefined && row.registry_id !== '' ? row.registry_id : '-'}</span>
    },
    beneficiary_id: {
        key: 'beneficiary_id',
        label: 'Beneficiary Id',
        render: (row) => <span className="font-semibold text-gray-800 text-sm">{row.beneficiary_id !== null && row.beneficiary_id !== undefined && row.beneficiary_id !== '' ? row.beneficiary_id : '-'}</span>
    },
    aadhaar_no: {
        key: 'aadhaar_no',
        label: 'Aadhaar No',
        render: (row) => <span className="font-mono text-gray-700 text-sm">{row.aadhaar_no !== null && row.aadhaar_no !== undefined && row.aadhaar_no !== '' ? row.aadhaar_no : '-'}</span>
    },
    name: {
        key: 'name',
        label: 'Name',
        render: (row) => <span className="text-gray-700 font-medium text-sm">{row.name !== null && row.name !== undefined && row.name !== '' ? row.name : '-'}</span>
    },
    address: {
        key: 'address',
        label: 'Address',
        render: (row) => {
            const val = row.address !== null && row.address !== undefined && row.address !== '' ? row.address : '-';
            return <span className="text-gray-600 text-xs truncate max-w-[150px]" title={val}>{val}</span>;
        }
    },
    mobile_no: {
        key: 'mobile_no',
        label: 'Mobile No',
        render: (row) => <span className="font-mono text-gray-700 text-sm">{row.mobile_no !== null && row.mobile_no !== undefined && row.mobile_no !== '' ? row.mobile_no : '-'}</span>
    },
    state: {
        key: 'state',
        label: 'State',
        render: (row) => <span className="text-gray-700 text-sm">{row.state !== null && row.state !== undefined && row.state !== '' ? row.state : '-'}</span>
    },
    ration_card_no: {
        key: 'ration_card_no',
        label: 'Ration Card No',
        render: (row) => <span className="font-mono text-gray-700 text-sm">{row.ration_card_no !== null && row.ration_card_no !== undefined && row.ration_card_no !== '' ? row.ration_card_no : '-'}</span>
    },
    vehicle_type: {
        key: 'vehicle_type',
        label: 'Vehicle Type',
        render: (row) => <span className="text-gray-700 text-sm">{row.vehicle_type !== null && row.vehicle_type !== undefined && row.vehicle_type !== '' ? row.vehicle_type : '-'}</span>
    },
    gst_registered: {
        key: 'gst_registered',
        label: 'GST Registered',
        render: (row) => <span className="text-gray-700 text-sm">{row.gst_registered !== null && row.gst_registered !== undefined && row.gst_registered !== '' ? row.gst_registered : '-'}</span>
    },
    annual_turnover: {
        key: 'annual_turnover',
        label: 'Annual Turnover',
        render: (row) => <span className="text-gray-700 text-sm">{row.annual_turnover !== null && row.annual_turnover !== undefined && row.annual_turnover !== '' ? row.annual_turnover : '-'}</span>
    },
    vehicle_count: {
        key: 'vehicle_count',
        label: 'Vehicle Count',
        render: (row) => <span className="text-gray-700 text-sm">{row.vehicle_count !== null && row.vehicle_count !== undefined && row.vehicle_count !== '' ? row.vehicle_count : '-'}</span>
    },
    luxury_vehicle_flag: {
        key: 'luxury_vehicle_flag',
        label: 'Luxury Vehicle Flag',
        render: (row) => <span className="text-gray-700 text-sm">{row.luxury_vehicle_flag !== null && row.luxury_vehicle_flag !== undefined && row.luxury_vehicle_flag !== '' ? row.luxury_vehicle_flag : '-'}</span>
    },
    itr_filed: {
        key: 'itr_filed',
        label: 'ITR Filed',
        render: (row) => <span className="text-gray-700 text-sm">{row.itr_filed !== null && row.itr_filed !== undefined && row.itr_filed !== '' ? row.itr_filed : '-'}</span>
    },
    last_income: {
        key: 'last_income',
        label: 'Last Income',
        render: (row) => <span className="text-gray-700 text-sm">{row.last_income !== null && row.last_income !== undefined && row.last_income !== '' ? row.last_income : '-'}</span>
    },
    director_flag: {
        key: 'director_flag',
        label: 'Director Flag',
        render: (row) => <span className="text-gray-700 text-sm">{row.director_flag !== null && row.director_flag !== undefined && row.director_flag !== '' ? row.director_flag : '-'}</span>
    },
    company_count: {
        key: 'company_count',
        label: 'Company Count',
        render: (row) => <span className="text-gray-700 text-sm">{row.company_count !== null && row.company_count !== undefined && row.company_count !== '' ? row.company_count : '-'}</span>
    },
    deceased_flag: {
        key: 'deceased_flag',
        label: 'Deceased Flag',
        render: (row) => <span className="text-gray-700 text-sm">{row.deceased_flag !== null && row.deceased_flag !== undefined && row.deceased_flag !== '' ? row.deceased_flag : '-'}</span>
    },
    suspended_flag: {
        key: 'suspended_flag',
        label: 'Suspended Flag',
        render: (row) => <span className="text-gray-700 text-sm">{row.suspended_flag !== null && row.suspended_flag !== undefined && row.suspended_flag !== '' ? row.suspended_flag : '-'}</span>
    },
    electricity_units_monthly: {
        key: 'electricity_units_monthly',
        label: 'Electricity Units Monthly',
        render: (row) => <span className="text-gray-700 text-sm">{row.electricity_units_monthly !== null && row.electricity_units_monthly !== undefined && row.electricity_units_monthly !== '' ? row.electricity_units_monthly : '-'}</span>
    },
    duplicate_aadhaar_score: {
        key: 'duplicate_aadhaar_score',
        label: 'Duplicate Aadhaar Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.duplicate_aadhaar_score !== null && row.duplicate_aadhaar_score !== undefined && row.duplicate_aadhaar_score !== '' ? row.duplicate_aadhaar_score : '-'}</span>
    },
    fuzzy_name_score: {
        key: 'fuzzy_name_score',
        label: 'Fuzzy Name Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.fuzzy_name_score !== null && row.fuzzy_name_score !== undefined && row.fuzzy_name_score !== '' ? row.fuzzy_name_score : '-'}</span>
    },
    multi_state_score: {
        key: 'multi_state_score',
        label: 'Multi State Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.multi_state_score !== null && row.multi_state_score !== undefined && row.multi_state_score !== '' ? row.multi_state_score : '-'}</span>
    },
    gst_risk_score: {
        key: 'gst_risk_score',
        label: 'GST Risk Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.gst_risk_score !== null && row.gst_risk_score !== undefined && row.gst_risk_score !== '' ? row.gst_risk_score : '-'}</span>
    },
    electricity_risk_score: {
        key: 'electricity_risk_score',
        label: 'Electricity Risk Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.electricity_risk_score !== null && row.electricity_risk_score !== undefined && row.electricity_risk_score !== '' ? row.electricity_risk_score : '-'}</span>
    },
    luxury_vehicle_score: {
        key: 'luxury_vehicle_score',
        label: 'Luxury Vehicle Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.luxury_vehicle_score !== null && row.luxury_vehicle_score !== undefined && row.luxury_vehicle_score !== '' ? row.luxury_vehicle_score : '-'}</span>
    },
    income_tax_score: {
        key: 'income_tax_score',
        label: 'Income Tax Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.income_tax_score !== null && row.income_tax_score !== undefined && row.income_tax_score !== '' ? row.income_tax_score : '-'}</span>
    },
    director_score: {
        key: 'director_score',
        label: 'Director Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.director_score !== null && row.director_score !== undefined && row.director_score !== '' ? row.director_score : '-'}</span>
    },
    total_risk_score: {
        key: 'total_risk_score',
        label: 'Total Risk Score',
        render: (row) => <span className="text-gray-700 text-sm">{row.total_risk_score !== null && row.total_risk_score !== undefined && row.total_risk_score !== '' ? row.total_risk_score : '-'}</span>
    },
    risk_category: {
        key: 'risk_category',
        label: 'Risk Category',
        render: (row) => <span className="text-gray-700 text-sm">{row.risk_category !== null && row.risk_category !== undefined && row.risk_category !== '' ? row.risk_category : '-'}</span>
    },
    review_status: {
        key: 'review_status',
        label: 'Review Status',
        render: (row) => <span className="text-gray-700 text-sm">{row.review_status !== null && row.review_status !== undefined && row.review_status !== '' ? row.review_status : '-'}</span>
    },
    officer_action: {
        key: 'officer_action',
        label: 'Officer Action',
        render: (row) => <span className="text-gray-700 text-sm">{row.officer_action !== null && row.officer_action !== undefined && row.officer_action !== '' ? row.officer_action : '-'}</span>
    },
    officer_remarks: {
        key: 'officer_remarks',
        label: 'Officer Remarks',
        render: (row) => {
            const val = row.officer_remarks !== null && row.officer_remarks !== undefined && row.officer_remarks !== '' ? row.officer_remarks : '-';
            return <span className="text-gray-600 text-xs truncate max-w-[150px]" title={val}>{val}</span>;
        }
    },
    reviewed_by: {
        key: 'reviewed_by',
        label: 'Reviewed By',
        render: (row) => <span className="text-gray-700 text-sm">{row.reviewed_by !== null && row.reviewed_by !== undefined && row.reviewed_by !== '' ? row.reviewed_by : '-'}</span>
    },
    validation_details: {
        key: 'validation_details',
        label: 'Validation Details',
        render: (row) => {
            const val = row.validation_details !== null && row.validation_details !== undefined && row.validation_details !== '' ? row.validation_details : '-';
            return <span className="text-gray-600 text-xs truncate max-w-[150px]" title={val}>{val}</span>;
        }
    },
    fuzzy_matches: {
        key: 'fuzzy_matches',
        label: 'Fuzzy Matches',
        render: (row) => {
            const val = row.fuzzy_matches !== null && row.fuzzy_matches !== undefined && row.fuzzy_matches !== '' ? row.fuzzy_matches : '-';
            return <span className="text-gray-700 text-xs truncate max-w-[150px]" title={val}>{val}</span>;
        }
    },
};

const defaultColumns = [
    'beneficiary_id',
    'aadhaar_no',
    'name',
    'state',
    'duplicate_aadhaar_score',
    'fuzzy_name_score',
    'total_risk_score',
    'risk_category'
];

const DedupResults = () => {
    const navigate = useNavigate();
    const { token, project, decodedToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [isRemarksOpen, setIsRemarksOpen] = useState(false);
    const [remarksActionType, setRemarksActionType] = useState('ACCEPT');
    const [remarksTargetRow, setRemarksTargetRow] = useState(null);
    const [remarksText, setRemarksText] = useState('');

    const [processedCount, setProcessedCount] = useState(0);

    const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
    const [columnSearchTerm, setColumnSearchTerm] = useState('');

    const [actionType, setActionType] = useState('Approve');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isColumnDropdownOpen) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest('.column-selector-container')) {
                setIsColumnDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isColumnDropdownOpen]);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!token) return;
        if (!isSilent) setIsLoading(true);
        try {
            const response = await axios.get(
                `${window._env_?.VITE_FAST_API || 'http://localhost:8000'}/dedup/results`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-project': project || 'none',
                    },
                }
            );
            setResults(response.data || []);

            try {
                const countRes = await axios.get(
                    `${window._env_?.VITE_FAST_API || 'http://localhost:8000'}/dedup/results/count`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'x-project': project || 'none',
                        },
                    }
                );
                setProcessedCount(countRes.data?.total_processed_count || 0);
            } catch (err) {
                console.error('Error fetching processed count:', err);
            }

            return { ok: true };
        } catch (err) {
            console.error('Error fetching deduplication results:', err);
            setResults([]);
            return { ok: false, message: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [token, project]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        const result = await fetchData(true);
        if (result.ok) toast.success('Deduplication results refreshed successfully!');
        else toast.error('Failed to refresh data.');
    };

    const handleExport = () => {
        if (!results || results.length === 0) {
            toast.error('No records available to export.');
            return;
        }

        const dataToExport = searchTerm ? filteredData : results;
        if (dataToExport.length === 0) {
            toast.error('No matching records found to export.');
            return;
        }

        const mappedData = dataToExport.map((row) => {
            const mappedRow = {};
            Object.keys(allColumnDefinitions).forEach((key) => {
                const label = allColumnDefinitions[key]?.label || key;
                const val = row[key];
                mappedRow[label] = val !== null && val !== undefined ? val : '';
            });
            return mappedRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Records');

        XLSX.writeFile(workbook, 'pending_beneficiary_records.xlsx');
        toast.success('Records exported to Excel successfully!');
    };

    const handleViewDetails = (row) => {
        setSelectedRecord(row);
        setActionType(row.officer_action || 'Approve');
        setRemarks(row.officer_remarks || '');
        setIsDetailsOpen(true);
    };

    const handleAccept = (row) => {
        setRemarksTargetRow(row);
        setRemarksActionType('ACCEPT');
        setRemarksText('');
        setIsRemarksOpen(true);
    };

    const handleReject = (row) => {
        setRemarksTargetRow(row);
        setRemarksActionType('REJECT');
        setRemarksText('');
        setIsRemarksOpen(true);
    };

    const handleRemarksSubmit = async (e) => {
        e.preventDefault();
        if (!remarksTargetRow) return;

        try {
            await axios.post(
                `${window._env_?.VITE_FAST_API || 'http://localhost:8000'}/dedup/results/action`,
                {
                    beneficiary_id: Number(remarksTargetRow.beneficiary_id),
                    action: remarksActionType,
                    remarks: remarksText
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-project': project || 'none',
                    },
                }
            );
            
            if (remarksActionType === 'ACCEPT') {
                toast.success(`Beneficiary ID ${remarksTargetRow.beneficiary_id} accepted successfully!`);
            } else {
                toast.success(`Beneficiary ID ${remarksTargetRow.beneficiary_id} rejected successfully!`);
            }
            
            setIsRemarksOpen(false);
            setRemarksTargetRow(null);
            setRemarksText('');
            fetchData(true);
        } catch (err) {
            console.error(`Error submitting ${remarksActionType} action:`, err);
            toast.error(err.response?.data?.detail || `Failed to submit ${remarksActionType.toLowerCase()} action.`);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            setIsDetailsOpen(false);
            toast.success(`Deduplication record successfully updated with status: ${actionType}`);
            fetchData(true);
        }, 1200);
    };

    const handleToggleColumn = (key) => {
        setSelectedColumns(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 1) return prev;
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const metrics = useMemo(() => {
        const total = results.length;
        const highRisk = results.filter(r => r.risk_category?.toLowerCase() === 'high').length;
        
        const aadhaarCounts = {};
        results.forEach(r => {
            const aadhaar = r.aadhaar_no;
            if (aadhaar !== null && aadhaar !== undefined && aadhaar !== '') {
                aadhaarCounts[aadhaar] = (aadhaarCounts[aadhaar] || 0) + 1;
            }
        });
        const dupAadhaar = results.filter(r => {
            const aadhaar = r.aadhaar_no;
            return aadhaar !== null && aadhaar !== undefined && aadhaar !== '' && aadhaarCounts[aadhaar] > 1;
        }).length;

        return [
            { title: 'Pending Review', value: total.toLocaleString(), icon: CaptivePortalIcon, bgcolor: 'bg-[#C5EAF0]' },
            { title: 'High Risk Records', value: highRisk.toLocaleString(), icon: ComplianceIcon, bgcolor: 'bg-[#FEE4FF]' },
            { title: 'Duplicate Aadhaar', value: dupAadhaar.toLocaleString(), icon: CDCIcon, bgcolor: 'bg-[#FFC93F40]' },
            { title: 'Total Processed Cases', value: processedCount.toLocaleString(), icon: ComplianceIcon, bgcolor: 'bg-[#E6F7F0]' },
        ];
    }, [results, processedCount]);

    const filteredData = useMemo(() => {
        return results.filter((item) =>
            Object.values(item).some((v) =>
                String(v || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [results, searchTerm]);

    const filteredColumnKeys = useMemo(() => {
        return Object.keys(allColumnDefinitions).filter(key => 
            allColumnDefinitions[key].label.toLowerCase().includes(columnSearchTerm.toLowerCase())
        );
    }, [columnSearchTerm]);

    const activeTableColumns = useMemo(() => {
        const activeCols = selectedColumns.map(key => allColumnDefinitions[key]).filter(Boolean);
        return [
            ...activeCols,
            {
                label: 'Actions',
                sortable: false,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleAccept(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F0FF] text-[#8E77BB] hover:bg-[#8E77BB] hover:text-white border border-[#D9CBEF] rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 shadow-sm"
                            title="Accept"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleReject(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDFBFF] text-[#2B125C] hover:bg-[#2B125C] hover:text-white border border-[#E2D9F3] rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 shadow-sm"
                            title="Reject"
                        >
                            Reject
                        </button>
                    </div>
                )
            }
        ];
    }, [selectedColumns]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb title={"MDM"} title2={"Data Review Queue"} title3={"Beneficiary & Risk Review"}/>

            <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-[#282F49]">Beneficiary & Risk Review</h1>
                    <p className="text-sm text-[#818181] mt-0.5">
                        {/* Resolve registry duplications and evaluate risk profile exceptions */}
                    </p>
                </div>
                <div className="flex justify-between gap-3 font-medium text-sm">
                    <button
                        title="Export to Excel"
                        onClick={handleExport}
                        disabled={isLoading || results.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8E77BB] text-white hover:bg-[#7963A3] rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold transition-all duration-200"
                    >
                        <Download className="h-4 w-4 text-white" />
                        <span>Export</span>
                    </button>
                    <button
                        title="Refresh"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait cursor-pointer bg-white"
                    >
                        <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div
                className="rounded-2xl p-4 mb-6"
                style={{
                    background: 'linear-gradient(270deg, #EFE7FF 17.24%, #8E77BB 93.06%, #2B125C 141.05%)',
                }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`flex items-center justify-center w-10 h-10 ${m.bgcolor} rounded-full`}>
                                    <img src={m.icon} alt={m.title} className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-medium text-[#332849]">
                                    {m.title}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-[#282F49]">
                                {isLoading ? (
                                    <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
                                ) : (
                                    m.value
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-[#332849]">Pending Beneficiary Records</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative column-selector-container">
                            <button
                                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium cursor-pointer transition-colors shadow-sm"
                            >
                                <SlidersHorizontal size={14} className="text-[#8E77BB]" />
                                Fields
                                <span className="flex items-center justify-center bg-[#8E77BB] text-white rounded-full text-[10px] w-4 h-4 font-bold">
                                    {selectedColumns.length}
                                </span>
                            </button>

                            {isColumnDropdownOpen && (
                                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3 max-h-[400px] flex flex-col">
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs">
                                        <button 
                                            onClick={() => setSelectedColumns(Object.keys(allColumnDefinitions))}
                                            className="text-[#8E77BB] font-semibold hover:underline cursor-pointer border-none bg-transparent"
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            onClick={() => setSelectedColumns(defaultColumns)}
                                            className="text-gray-500 font-semibold hover:underline cursor-pointer border-none bg-transparent"
                                        >
                                            Reset Defaults
                                        </button>
                                    </div>
                                    
                                    <div className="relative mb-2 flex-shrink-0">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search columns..."
                                            className="w-full rounded-md border border-gray-200 py-1 pl-8 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-purple-300"
                                            value={columnSearchTerm}
                                            onChange={(e) => setColumnSearchTerm(e.target.value)}
                                        />
                                        {columnSearchTerm && (
                                            <button
                                                onClick={() => setColumnSearchTerm('')}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                                        {filteredColumnKeys.map(key => {
                                            const isChecked = selectedColumns.includes(key);
                                            return (
                                                <label 
                                                    key={key} 
                                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleToggleColumn(key)}
                                                        className="cursor-pointer accent-[#8E77BB]"
                                                    />
                                                    <span className={`font-medium ${isChecked ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                        {allColumnDefinitions[key].label}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                        {filteredColumnKeys.length === 0 && (
                                            <p className="text-gray-400 text-center py-4 text-xs">No columns match search.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-[220px] rounded-lg border border-gray-200 py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={activeTableColumns}
                    data={filteredData}
                    isLoading={isLoading}
                    refetch={() => fetchData(true)}
                />
            </div>

            {isDetailsOpen && selectedRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#8E77BB]/10 text-[#8E77BB] rounded-xl">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">View Beneficiary Record Details</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">Beneficiary Registry ID: {selectedRecord.registry_id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Demographic Profile</h4>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="font-semibold text-gray-800">{selectedRecord.name !== null && selectedRecord.name !== undefined && selectedRecord.name !== '' ? selectedRecord.name : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Mobile No:</span>
                                            <span className="font-semibold text-gray-800 font-mono">{selectedRecord.mobile_no !== null && selectedRecord.mobile_no !== undefined && selectedRecord.mobile_no !== '' ? selectedRecord.mobile_no : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Aadhaar No:</span>
                                            <span className="font-semibold text-gray-800 font-mono">{selectedRecord.aadhaar_no !== null && selectedRecord.aadhaar_no !== undefined && selectedRecord.aadhaar_no !== '' ? selectedRecord.aadhaar_no : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">State / Address:</span>
                                            <span className="font-semibold text-gray-800 text-right max-w-[150px] truncate" title={selectedRecord.address !== null && selectedRecord.address !== undefined && selectedRecord.address !== '' ? selectedRecord.address : '-'}>
                                                {selectedRecord.state !== null && selectedRecord.state !== undefined && selectedRecord.state !== '' ? selectedRecord.state : '-'} ({selectedRecord.address !== null && selectedRecord.address !== undefined && selectedRecord.address !== '' ? selectedRecord.address : '-'})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Economic Indicators</h4>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ration Card:</span>
                                            <span className="font-semibold text-gray-800">{selectedRecord.ration_card_no !== null && selectedRecord.ration_card_no !== undefined && selectedRecord.ration_card_no !== '' ? selectedRecord.ration_card_no : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">ITR Filed / Income:</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.itr_filed !== null && selectedRecord.itr_filed !== undefined && selectedRecord.itr_filed !== '' ? selectedRecord.itr_filed : '-'} / {selectedRecord.last_income !== null && selectedRecord.last_income !== undefined && selectedRecord.last_income !== '' ? selectedRecord.last_income : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Electricity Units:</span>
                                            <span className="font-semibold text-gray-800">{selectedRecord.electricity_units_monthly !== null && selectedRecord.electricity_units_monthly !== undefined && selectedRecord.electricity_units_monthly !== '' ? selectedRecord.electricity_units_monthly : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">GST / Turnover:</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.gst_registered !== null && selectedRecord.gst_registered !== undefined && selectedRecord.gst_registered !== '' ? selectedRecord.gst_registered : '-'} / {selectedRecord.annual_turnover !== null && selectedRecord.annual_turnover !== undefined && selectedRecord.annual_turnover !== '' ? selectedRecord.annual_turnover : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Vehicles (Luxury):</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.vehicle_count !== null && selectedRecord.vehicle_count !== undefined && selectedRecord.vehicle_count !== '' ? selectedRecord.vehicle_count : '-'} / {selectedRecord.luxury_vehicle_flag !== null && selectedRecord.luxury_vehicle_flag !== undefined && selectedRecord.luxury_vehicle_flag !== '' ? selectedRecord.luxury_vehicle_flag : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Special Warnings</h4>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Director Status:</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.director_flag !== null && selectedRecord.director_flag !== undefined && selectedRecord.director_flag !== '' ? selectedRecord.director_flag : '-'} / {selectedRecord.company_count !== null && selectedRecord.company_count !== undefined && selectedRecord.company_count !== '' ? selectedRecord.company_count : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Deceased Flag:</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.deceased_flag !== null && selectedRecord.deceased_flag !== undefined && selectedRecord.deceased_flag !== '' ? selectedRecord.deceased_flag : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Suspended Flag:</span>
                                            <span className="font-semibold text-gray-800">
                                                {selectedRecord.suspended_flag !== null && selectedRecord.suspended_flag !== undefined && selectedRecord.suspended_flag !== '' ? selectedRecord.suspended_flag : '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Risk Category:</span>
                                            <span className="font-bold text-gray-800">{selectedRecord.risk_category !== null && selectedRecord.risk_category !== undefined && selectedRecord.risk_category !== '' ? selectedRecord.risk_category : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total Risk Score:</span>
                                            <span className="font-bold text-gray-800">{selectedRecord.total_risk_score !== null && selectedRecord.total_risk_score !== undefined && selectedRecord.total_risk_score !== '' ? selectedRecord.total_risk_score : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                                    <ShieldAlert size={16} className="text-red-500" />
                                    Deduplication & Exception Risk Matrix Breakdown
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Duplicate Aadhaar</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.duplicate_aadhaar_score !== null && selectedRecord.duplicate_aadhaar_score !== undefined && selectedRecord.duplicate_aadhaar_score !== '' ? selectedRecord.duplicate_aadhaar_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Fuzzy Name Score</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.fuzzy_name_score !== null && selectedRecord.fuzzy_name_score !== undefined && selectedRecord.fuzzy_name_score !== '' ? selectedRecord.fuzzy_name_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Multi-State Score</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.multi_state_score !== null && selectedRecord.multi_state_score !== undefined && selectedRecord.multi_state_score !== '' ? selectedRecord.multi_state_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">GST Exception Score</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.gst_risk_score !== null && selectedRecord.gst_risk_score !== undefined && selectedRecord.gst_risk_score !== '' ? selectedRecord.gst_risk_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Electricity Exception</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.electricity_risk_score !== null && selectedRecord.electricity_risk_score !== undefined && selectedRecord.electricity_risk_score !== '' ? selectedRecord.electricity_risk_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Luxury Vehicle Score</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.luxury_vehicle_score !== null && selectedRecord.luxury_vehicle_score !== undefined && selectedRecord.luxury_vehicle_score !== '' ? selectedRecord.luxury_vehicle_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Income Tax Exception</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.income_tax_score !== null && selectedRecord.income_tax_score !== undefined && selectedRecord.income_tax_score !== '' ? selectedRecord.income_tax_score : '-'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <span className="block text-xs text-gray-400 font-medium">Director Exception</span>
                                        <span className="text-lg font-bold text-gray-800">{selectedRecord.director_score !== null && selectedRecord.director_score !== undefined && selectedRecord.director_score !== '' ? selectedRecord.director_score : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedRecord.validation_details && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                                    <h4 className="text-xs font-bold uppercase text-blue-700 tracking-wider mb-2">Engine Validation Details & Notes</h4>
                                    <p className="text-sm text-gray-700 font-mono leading-relaxed">{selectedRecord.validation_details}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isRemarksOpen && remarksTargetRow && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in border border-gray-100 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${remarksActionType === 'ACCEPT' ? 'bg-[#8E77BB]' : 'bg-[#2B125C]'}`} />
                                <h3 className="text-lg font-bold text-gray-900">
                                    {remarksActionType === 'ACCEPT' ? 'Accept Record' : 'Reject Record'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRemarksOpen(false);
                                    setRemarksTargetRow(null);
                                    setRemarksText('');
                                }}
                                className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRemarksSubmit} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                                    Please provide remarks for executing this action.
                                </p>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">Name</span>
                                        <span className="font-semibold text-gray-800">{remarksTargetRow.name || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">Ration Card</span>
                                        <span className="font-semibold text-gray-800 font-mono">{remarksTargetRow.ration_card_no || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-medium">Aadhaar</span>
                                        <span className="font-semibold text-gray-800 font-mono">{remarksTargetRow.aadhaar_no || '-'}</span>
                                    </div>
                                </div>
                                
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                                    Remarks / Reason
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[100px] resize-none"
                                    placeholder="Enter your remarks here..."
                                    value={remarksText}
                                    onChange={(e) => setRemarksText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRemarksOpen(false);
                                        setRemarksTargetRow(null);
                                        setRemarksText('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-5 py-2 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm ${
                                        remarksActionType === 'ACCEPT'
                                            ? 'bg-[#8E77BB] hover:bg-[#7963A3]'
                                            : 'bg-[#2B125C] hover:bg-[#1E0D42]'
                                    }`}
                                >
                                    Confirm Action
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DedupResults;
