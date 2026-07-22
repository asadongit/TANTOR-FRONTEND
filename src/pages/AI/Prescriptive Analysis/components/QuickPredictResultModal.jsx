import React from 'react';
import { createPortal } from 'react-dom';
import FieldTooltip from './FieldTooltip';
import { formatToFourDecimals } from '../utils/Predictiveutils';

const QuickPredictResultModal = ({ isOpen, onClose, result, errorMessage, desiredClass, isRegression: isRegressionModel = false, limeTooltip = [], counterfactualTooltip = [] }) => {
  if (!isOpen) return null;

  const limeReport = result?.lime_report || null;
  const counterfactualRows = Array.isArray(result?.counterfactual_report) ? result.counterfactual_report : [];

  const modelType = limeReport?.model_type || '';
  const isRegression = isRegressionModel || modelType?.toLowerCase().includes('regression');
  const predictedValueKey = isRegression ? 'predicted_value' : 'predicted_class_name';
  const predictedValueLabel = isRegression ? 'Predicted Value' : 'Predicted Class';
  const desiredValueLabel = isRegression ? 'Desired Value' : 'Desired Class';

  return createPortal(
    <div className="fixed inset-0 z-[15000] flex items-center justify-center bg-[#00000099] p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Predictive Analysis Report</h3>
          <button type="button" onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600" aria-label="Close quick predict report">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 flex items-center">LIME
                  <FieldTooltip lines={limeTooltip} position="right" />
                </h4>
                {limeReport ? (
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs text-gray-500">{desiredValueLabel}</p>
                        <p className="font-medium">{isRegression ? formatToFourDecimals(desiredClass) : desiredClass || '-'}</p>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs text-gray-500">{predictedValueLabel}</p>
                        <p className="font-medium">{isRegression ? formatToFourDecimals(limeReport[predictedValueKey]) : limeReport[predictedValueKey] ?? '-'}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600"><th className="px-4 py-2 font-medium">S.No</th><th className="px-4 py-2 font-medium">Feature Condition</th><th className="px-4 py-2 font-medium">Contribution</th></tr>
                        </thead>
                        <tbody>
                          {(limeReport.explanation_for_class || []).length > 0 ? (
                            limeReport.explanation_for_class.map((item, idx) => (
                              <tr key={`${item?.[0] || 'lime'}-${idx}`} className="border-t border-gray-100">
                                <td className="px-4 py-2">{idx + 1}</td>
                                <td className="px-4 py-2">{item?.[0] ?? '-'}</td>
                                <td className="px-4 py-2">{item?.[1] ?? '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">No LIME explanation available</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No LIME report available.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 flex items-center">Counterfactual
                  <FieldTooltip lines={counterfactualTooltip} position="right" />
                </h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600"><th className="px-4 py-2 font-medium">S.No</th><th className="px-4 py-2 font-medium">Feature</th><th className="px-4 py-2 font-medium">Original</th><th className="px-4 py-2 font-medium">Counterfactual</th><th className="px-4 py-2 font-medium">Change</th></tr>
                      </thead>
                      <tbody>
                        {counterfactualRows.length > 0 ? (
                          counterfactualRows.map((item, idx) => (
                            <tr key={`${item?.Feature || 'cf'}-${idx}`} className="border-t border-gray-100">
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2">{item?.Feature ?? '-'}</td>
                              <td className="px-4 py-2">{item?.Original ?? '-'}</td>
                              <td className="px-4 py-2">{item?.Counterfactual ?? '-'}</td>
                              <td className="px-4 py-2">{item?.Change ?? '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-500">No counterfactual report available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickPredictResultModal;
