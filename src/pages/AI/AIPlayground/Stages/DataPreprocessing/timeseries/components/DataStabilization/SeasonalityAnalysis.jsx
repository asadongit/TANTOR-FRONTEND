import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import InfoButton from '../../../../../components/InfoButton';
import ToggleSwitch from './ToggleSwitch';
import { dataStabilizationDescriptions } from '../../../../../../../../hooks/AI/datapreprocessing/descriptions';

function SeasonalityAnalysis({
	title = 'Seasonality Analysis',
	isToggled,
	isExpanded,
	onToggle,
	onExpand,
	readonly,
	sectionKey = 'seasonalityAnalysis'
}) {
	return (
		<div className="rounded-lg transition-all bg-gray-50">
			<div className="p-4 flex items-center justify-between">
				<div className="flex-1 flex items-center gap-2">
					<div className="flex-1">
						<div className="flex flex-row items-center">
							<h4 className="text-sm font-medium mr-2 text-gray-700">
								{title}
							</h4>
							<InfoButton sectionDescriptions={dataStabilizationDescriptions} section={sectionKey} />
						</div>
						{/* Description available via the info button */}
					</div>
				</div>

				<div className="flex items-center gap-3">
					<ToggleSwitch checked={isToggled} onChange={onToggle} disabled={readonly} />
					{/* {isToggled && (
						<button onClick={onExpand} className="text-gray-400 hover:text-gray-600" type="button">
							{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
						</button>
					)} */}
				</div>
			</div>

			{/* {isToggled && isExpanded && (
				<div className="px-4 pb-4">
					<div className="bg-white border border-[#E2E8F0] rounded-lg p-3">
						<p className="text-sm text-gray-700">
							Seasonality checks will be applied during this step and included in the preprocessing output.
						</p>
					</div>
				</div>
			)} */}
		</div>
	);
}

export default SeasonalityAnalysis;
