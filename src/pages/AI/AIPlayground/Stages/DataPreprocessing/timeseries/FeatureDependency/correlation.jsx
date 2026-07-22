import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import InfoButton from '../../../../components/InfoButton';

function CorrelationAnalysis({
  isToggled,
  isExpanded,
  onToggle,
  onExpand,
  readonly,
  isLoading,
  correlationReport = [],
  selectedFeatures = [],
  onFeatureSelect,
  sectionDescriptions,
  showError = false,
  maxDroppableFeatures = 0,
  isDropperEnabled = false,
  onDropperToggle = () => {}
}) {

  return (
    <div className="bg-gray-50 rounded-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex flex-row">
            <h4 className="text-sm font-medium text-gray-700 mr-2">Correlation Analysis</h4>
            <InfoButton sectionDescriptions={sectionDescriptions} section="correlation" />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{`${correlationReport.length} feature pairs analyzed | ${selectedFeatures.length} selected to drop`}</p>
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
              <span className="text-sm font-medium text-gray-700">Correlation Column Dropper</span>
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

          {showError && (
            <p className="text-xs text-[#EF4D5F] mb-3 pl-0.5">You must leave at least one feature undropped</p>
          )}

          <div className={`border rounded-lg overflow-hidden max-h-96 overflow-y-auto transition-colors ${
            showError ? 'border-[#EF4D5F] bg-[#FFF7F8]' : 'border-[#CCCCCC]'
          }`}>
            <table className="w-full">
              <thead className={`sticky top-0 z-10 border-b ${showError ? 'bg-[#FFF7F8] border-[#EF4D5F]' : 'bg-gray-50 border-[#CCCCCC]'}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Feature 1</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Feature 2</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Correlation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">{isDropperEnabled ? 'Drop Feature 2?' : 'Enable Dropper'}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {correlationReport.length > 0 ? (
                  [...correlationReport]
                    .sort((a, b) => Math.abs(b.correlation ?? 0) - Math.abs(a.correlation ?? 0))
                    .map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.col_a}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.col_b}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {row.correlation != null && typeof row.correlation === 'number'
                            ? row.correlation.toFixed(4)
                            : row.correlation != null ? row.correlation : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                            row.risk_level?.includes('Very High')
                              ? 'bg-[#F276A74D] text-[#EF4D5F]'
                              : row.risk_level?.includes('High')
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-[#2AC79240] text-[#069B68]'
                          }`}>
                            {row.risk_level?.split(' ').slice(0, 2).join(' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isDropperEnabled ? (
                            <input
                              type="checkbox"
                              checked={selectedFeatures.includes(row.col_a)}
                              onChange={() => onFeatureSelect(row.col_a)}
                              disabled={readonly || isLoading }
                              style={{ accentColor: showError ? '#EF4D5F' : '#8E77BB' }}
                              className={`w-4 h-4 rounded border transition-colors ${
                                showError
                                  ? 'border-[#EF4D5F] focus:ring-red-300'
                                  : 'border-[#CCCCCC] focus:ring-[#8E77BB]'
                              }`}
                            />
                          ) : (
                            <span className="text-sm text-gray-400 italic">Enable switch to drop</span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-400 text-sm">
                      No correlation data available.
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

export default CorrelationAnalysis;
