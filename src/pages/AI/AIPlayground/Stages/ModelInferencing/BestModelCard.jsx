import React from 'react';
import { Award } from 'lucide-react';

const BestModelCard = ({ bestModel, truncateName }) => {
  return (
    <div className="bg-gradient-to-r from-[#8e78b7] via-purple-300 to-purple-100 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="text-yellow-600 text-sm font-medium">Best Model</div>
            <div className="text-xs text-gray-500">Based on highest train {bestModel.metricName?.toLowerCase()}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
          <div className="text-gray-500 text-xs mb-1">Model</div>
          <div className="text-gray-900 font-semibold text-sm" title={bestModel.name}>
            {truncateName(bestModel.name, 50)}
          </div>
        </div>

        <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
          <div className="text-gray-500 text-xs mb-1">{bestModel.metricName}</div>
          <div className="text-gray-900 font-semibold text-xl">{bestModel.value}</div>
        </div>
      </div>
    </div>
  );
};

export default BestModelCard;