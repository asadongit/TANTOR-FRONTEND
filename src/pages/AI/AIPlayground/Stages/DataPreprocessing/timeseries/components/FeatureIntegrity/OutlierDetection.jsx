
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import InfoButton from '../../../../../components/InfoButton';
import { featureSelectionDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

const OutlierDetection = ({
	toggles,
	toggleSwitch,
	expandedSections,
	toggleSection,
	outlierMethod,
	setOutlierMethod,
	hoveredOutlier,
	setHoveredOutlier,
	outlierMethods,
	readonly,
}) => {
	return (
		<div className="bg-[#FAFAFA] rounded-lg">
			<div className="p-4 flex items-center justify-between">
				<div className="flex-1 flex items-center gap-2">
					<h4 className="text-sm font-medium text-gray-900">Detect Outliers</h4>
					<InfoButton sectionDescriptions={featureSelectionDescriptions} section="detectOutliers" />
				</div>
				<div className="flex items-center gap-3">
					<ToggleSwitch checked={toggles.detectOutliers} onChange={() => toggleSwitch('detectOutliers')} disabled={readonly} />
					{toggles.detectOutliers && (
						<button onClick={() => toggleSection('detectOutliers')} className="text-gray-400 hover:text-gray-600">
							{expandedSections.detectOutliers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
						</button>
					)}
				</div>
			</div>

			{toggles.detectOutliers && expandedSections.detectOutliers && (
				<div className="px-4 pb-4 border-t border-gray-100">
					<div className="mt-4 mb-20 grid grid-cols-2 gap-3">
						{outlierMethods.map((method) => (
							<div key={method.value} className="relative">
								<label
									className={`flex items-center gap-3 p-3 rounded-lg transition-all ${outlierMethod === method.value ? 'border-[#8E77BB] bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'} ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
									onMouseEnter={() => setHoveredOutlier(method.value)}
									onMouseLeave={() => setHoveredOutlier(null)}
								>
									<input
										type="radio"
										name="outlierMethod"
										value={method.value}
										checked={outlierMethod === method.value}
										onChange={(e) => !readonly && setOutlierMethod(e.target.value)}
										disabled={readonly}
										className="w-4 h-4 border-gray-300 focus:ring-[#8E77BB]"
										style={{ accentColor: '#8E77BB' }}
									/>
									<span className={`text-sm font-medium ${outlierMethod === method.value ? 'text-[#8E77BB]' : 'text-gray-700'}`}>{method.label}</span>
								</label>
								{hoveredOutlier === method.value && (
									<div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[#332849] text-white text-xs rounded-lg shadow-lg">
										<div className="absolute -top-1 left-4 w-2 h-2 bg-[#332849] transform rotate-45" />
										{method.description}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default OutlierDetection;

