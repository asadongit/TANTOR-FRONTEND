import React from 'react';
import { ChevronDown, ChevronUp, CircleCheckBig, CircleX, TriangleAlert } from 'lucide-react';
import InfoButton from '../../../../components/InfoButton';

function VIFAnalysis({
  isToggled,
  isExpanded,
  onToggle,
  onExpand,
  readonly,
  isLoading,
  vifReport = [],
  selectedFeatures = [],
  onFeatureSelect,
  sectionDescriptions,
  showError = false,
  maxDroppableFeatures = 0,
  isDropperEnabled = false,
  onDropperToggle = () => {}
}) {
  const riskCounts = vifReport.reduce((acc, curr) => {
    const risk = curr.Multicollinearity_Risk?.toLowerCase();
    if (risk?.includes('high')) acc.high++;
    else if (risk?.includes('moderate')) acc.moderate++;
    else acc.low++;
    return acc;
  }, { low: 0, moderate: 0, high: 0 });

  return (
    <div className="bg-gray-50 rounded-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex flex-row">
            <h4 className="text-sm font-medium text-gray-700 mr-2">VIF Analysis</h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="vif" isLastSection={true} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{`${vifReport.length} features analyzed | ${selectedFeatures.length} selected to drop`}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`relative inline-flex items-center ${readonly || isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={isToggled}
              onChange={onToggle}
              disabled={readonly || isLoading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
            </label>
          {isToggled && (
            <button onClick={onExpand} className="text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {isToggled && isExpanded && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">VIF Column Dropper</span>
              <label className={`relative inline-flex items-center ${readonly || isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isDropperEnabled}
                  onChange={onDropperToggle}
                  disabled={readonly || isLoading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
              </label>
            </div>
            {isDropperEnabled && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Selected: {selectedFeatures.length}</span>
              </div>
            )}
          </div>

          {/* Risk summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#F7FFFC] border border-[#36AD8F] rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-[#D4FFF4] flex items-center justify-center">
                  <CircleCheckBig className="w-5 h-5 text-[#36AD8F]" />
                </div>
                <span className="text-sm font-medium text-[#332849]">Low Risk</span>
              </div>
              <div className="text-3xl font-bold text-[#36AD8F]">{riskCounts.low}</div>
            </div>

            <div className="bg-[#FFF8F2] border border-[#E08E40] rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-[#FFE8D3] flex items-center justify-center">
                  <TriangleAlert className="w-5 h-5 text-[#E08E40]" />
                </div>
                <span className="text-sm font-medium text-[#332849]">Moderate Risk</span>
              </div>
              <div className="text-3xl font-bold text-[#E08E40]">{riskCounts.moderate}</div>
            </div>

            <div className="bg-[#FFF7F8] border border-[#EF4D5F] rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-[#FFDCE0] flex items-center justify-center">
                  <CircleX className="w-5 h-5 text-[#EF4D5F]" />
                </div>
                <span className="text-sm font-medium text-[#332849]">High Risk</span>
              </div>
              <div className="text-3xl font-bold text-[#EF4D5F]">{riskCounts.high}</div>
            </div>
          </div>

          {showError && (
            <p className="text-xs text-[#EF4D5F] mb-3 pl-0.5">You must leave at least one feature undropped</p>
          )}

          <div className={`border rounded-lg overflow-hidden max-h-96 overflow-y-auto transition-colors ${
            showError ? 'border-[#EF4D5F] bg-[#FFF7F8]' : 'border-[#CCCCCC]'
          }`}>
            <table className="w-full">
              <thead className={`sticky top-0 z-10 border-b ${showError ? 'bg-[#FFF7F8] border-[#EF4D5F]' : 'bg-gray-50 border-[#CCCCCC]'}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Feature</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">VIF Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">{isDropperEnabled ? 'Drop?' : 'Enable Dropper'}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {vifReport.length > 0 ? (
                  [...vifReport]
                    .sort((a, b) => (b.VIF ?? 0) - (a.VIF ?? 0))
                    .map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.Feature}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {row.VIF != null && typeof row.VIF === 'number'
                            ? row.VIF.toFixed(4)
                            : row.VIF != null ? row.VIF : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-4 py-1 rounded-md text-xs font-medium ${
                            row.Multicollinearity_Risk?.toLowerCase().includes('high')
                              ? 'bg-[#F276A74D] text-[#EF4D5F]'
                              : row.Multicollinearity_Risk?.toLowerCase().includes('moderate')
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-[#2AC79240] text-[#069B68]'
                          }`}>
                            {row.Multicollinearity_Risk}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isDropperEnabled ? (
                            <input
                              type="checkbox"
                              checked={selectedFeatures.includes(row.Feature)}
                              onChange={() => onFeatureSelect(row.Feature)}
                              disabled={readonly || isLoading || (!selectedFeatures.includes(row.Feature) && selectedFeatures.length >= maxDroppableFeatures)}
                              style={{ accentColor: showError ? '#EF4D5F' : '#8E77BB' }}
                              className={`w-4 h-4 rounded border transition-colors ${
                                showError
                                  ? 'border-[#EF4D5F] focus:ring-red-300'
                                  : 'border-[#CCCCCC] focus:ring-[#8E77BB]'
                              }`}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">Enable switch to drop</span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-10 text-center text-gray-400 text-sm">
                      No VIF data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default VIFAnalysis;
