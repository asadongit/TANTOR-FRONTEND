import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import InfoButton from '../../../../../components/InfoButton';
import { featureSelectionDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

const HighUniqunessDrop = ({
	columns,
	toggles,
	toggleSwitch,
	expandedSections,
	toggleSection,
	selectedColumns,
	handleColumnToggle,
	selectAll,
	handleSelectAll,
	dropLowValueError,
	readonly,
	totalFields,
	selectedCount,
}) => {
	return (
		<div>
			{/* Drop Low-Value Columns Section */}
			<div className="bg-[#FAFAFA] rounded-lg">
				<div className="p-4 flex items-center justify-between">
					<div className="flex-1 flex items-center gap-2">
						<h4 className="text-sm font-medium text-gray-900">Drop Low-Value Columns</h4>
						<InfoButton sectionDescriptions={featureSelectionDescriptions} section="dropLowValue" />
					</div>
					<div className="flex items-center gap-3">
						<ToggleSwitch checked={toggles.dropLowValue} onChange={() => toggleSwitch('dropLowValue')} disabled={readonly} />
						{toggles.dropLowValue && (
							<button onClick={() => toggleSection('dropLowValue')} className="text-gray-400 hover:text-gray-600">
								{expandedSections.dropLowValue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
							</button>
						)}
					</div>
				</div>

				{toggles.dropLowValue && expandedSections.dropLowValue && (
					<div className="px-4 pb-4 border-t border-gray-100">
						<div className="mt-4">
							<div className="flex items-center justify-between mb-4">
								<label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
									<input type="checkbox" checked={selectAll} onChange={handleSelectAll} disabled={readonly} className="w-4 h-4 border-gray-300 rounded" style={{ accentColor: '#8E77BB' }} />
									Select All
								</label>
								<span className="text-xs text-gray-400">Total Fields: {totalFields} | Selected: {selectedCount}</span>
							</div>

							<div className="grid grid-cols-3 gap-x-3 gap-y-3 max-h-96 overflow-y-auto pr-2">
								{columns.map((column, idx) => {
									const columnKey = `${column.name}-${idx}`;
									return (
										<div
											key={columnKey}
											onClick={() => !readonly && handleColumnToggle(columnKey)}
											className={`flex items-center gap-2 p-2 rounded transition-all ${selectedColumns[columnKey] ? 'border-[#8E77BB] bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'} ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
										>
											<input type="checkbox" checked={selectedColumns[columnKey] || false} onChange={() => {}} disabled={readonly} className="w-4 h-4 border-gray-300 rounded mt-0.5 pointer-events-none" style={{ accentColor: '#8E77BB' }} />
											<div className="flex-1">
												<div className="text-sm text-gray-700">{column.name}</div>
												<div className="text-xs text-gray-400">{column.uniqueness}</div>
											</div>
										</div>
									);
								})}
							</div>

							{dropLowValueError && <p className="text-xs text-[#EF4D5F] mt-3 pl-0.5">{dropLowValueError}</p>}
						</div>
					</div>
				)}

				{toggles.dropLowValue && !expandedSections.dropLowValue && dropLowValueError && (
					<div className="px-4 pb-3"><p className="text-xs text-[#EF4D5F]">{dropLowValueError}</p></div>
				)}
			</div>
		</div>
	);
};

export default HighUniqunessDrop;
