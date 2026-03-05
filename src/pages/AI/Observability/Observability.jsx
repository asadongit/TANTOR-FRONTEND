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
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h1 className="satoshi-heading">Observability</h1>

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

            <div>
                <nav className="flex gap-2">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(idx)}
                            className={`px-4 py-1 rounded-full text-sm transition-colors duration-200 ${
                                activeTab === idx
                                    ? 'bg-white text-[#8e78b7] ring-1 ring-[#8e78b7]'
                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
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