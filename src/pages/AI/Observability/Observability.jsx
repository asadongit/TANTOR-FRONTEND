import React, { useState } from 'react'
import Breadcrumb from '../../../components/Breadcrumb';
import GenAi from './Components/GenAi';
import ML from './Components/ML';

function Observability() {
    const [activeTab, setActiveTab] = useState(0);

    const [selectedPeriod, setSelectedPeriod] = useState('7 Days');
    const [refreshKey, setRefreshKey] = useState(0);

    const tabs = [
      { label: 'ML', key: 'ml' },
      { label: 'GenAI', key: 'genai' }
    ];

    const periods = ['7 Days', '15 Days', '30 Days'];

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">Observability</h1>

                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md" role="group" aria-label="Periods">
                        {periods.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setSelectedPeriod(p)}
                                className={`px-2 py-1 text-sm -ml-px border-[1px] border-[#8e78b7] first:ml-0 first:rounded-l-md last:rounded-r-md focus:outline-none
                                    ${selectedPeriod === p
                                        ? 'bg-[#8e78b7] text-white'
                                        : 'bg-transparent text-gray-700'
                                    }`}
                                aria-pressed={selectedPeriod === p}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* <button
                        type="button"
                        onClick={() => { setSelectedPeriod('7 Days'); setRefreshKey(k => k + 1); }}
                        className="ml-3 px-2 py-1 text-sm rounded-md border-[1px] border-[#8e78b7] bg-white text-[#8e78b7] focus:outline-none"
                    >
                        Reset
                    </button> */}
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="flex">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(idx)}
                            className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === idx
                                    ? 'border-b-2 border-[#8e78b7] text-[#8e78b7]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 0 && (
                <ML selectedPeriod={selectedPeriod} refreshKey={refreshKey} />
            )}
            {activeTab === 1 && <GenAi />}
        </div>
    )
}

export default Observability