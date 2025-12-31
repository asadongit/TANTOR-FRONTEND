import { MoreVertical } from 'lucide-react';
import { AIPlaygroundLayout } from '../AIPlaygroundLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Cell } from 'recharts';
import ConfigurationModal from '../modals/XAI/ConfigurationModal';
import SaveModelModal from '../modals/XAI/SaveModelModal';
import GovernanceReportModal from '../modals/XAI/GovernanceReportModal';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../../../../components/DataTable';

function XAI() {
  const location = useLocation();
  const readonly = location.state?.mode === 'view';
  const [selectedModel, setSelectedModel] = useState('model1');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [configData, setConfigData] = useState({
    modelAlias: '',
    pdpTargetClass: '',
    cbDesiredClass: '',
    cfInstanceIndex: '',
    pdpFeatures: [],
    featureFlipSummary: false
  });

  // Feature Flip Summary Data
  const featureFlipData = [
    { id: 1, feature: 'annual_income', affected: 51.6, change: '+6837.51', direction: '↑ Increase' },
    { id: 2, feature: 'age', affected: 20.7, change: '+1.83', direction: '↑ Increase' },
    { id: 3, feature: 'total_claim_amount', affected: 6.1, change: '-290.42', direction: '↓ Decrease' },
    { id: 4, feature: 'total_products_owned', affected: 4.6, change: '+0.11', direction: '↑ Increase' },
    { id: 5, feature: 'years_as_customer', affected: 3.3, change: '-0.72', direction: '↓ Decrease' },
    { id: 6, feature: 'avg_premium_per_product', affected: 3.3, change: '+77.93', direction: '↑ Increase' },
    { id: 7, feature: 'credit_score', affected: 3.3, change: '-16.28', direction: '↓ Decrease' },
    { id: 8, feature: 'purchase_likelihood', affected: 2.5, change: '-0.03', direction: '↓ Decrease' },
    { id: 9, feature: 'total_premium_amount', affected: 1.5, change: '-250.34', direction: '↓ Decrease' },
    { id: 10, feature: 'days_since_last_quote', affected: 2.1, change: '+10.41', direction: '↑ Increase' },
    { id: 11, feature: 'years_at_current_job', affected: 2, change: '-0.58', direction: '↓ Decrease' },
    { id: 12, feature: 'net_promoter_score', affected: 1.7, change: '-2.92', direction: '↓ Decrease' },
    { id: 13, feature: 'website_visits_last_quarter', affected: 1, change: '-1.47', direction: '↓ Decrease' },
    { id: 14, feature: 'months_since_last_purchase', affected: 0.7, change: '+1.75', direction: '↔ Neutral' },
    { id: 15, feature: 'household_size', affected: 0.6, change: '-0.13', direction: '↓ Decrease' },
    { id: 16, feature: 'social_media_engagement', affected: 0.3, change: '-0.31', direction: '↓ Decrease' },
    { id: 17, feature: 'num_claims_last_3_years', affected: 0.3, change: '-0.14', direction: '↓ Decrease' },
    { id: 18, feature: 'claim_rate', affected: 0.3, change: '-0.06', direction: '↓ Decrease' }
  ];

  // Counterfactual Data
  const counterfactualData = [
    { id: 1, feature: 'purchase_likelihood', original: '0.2000000001490162', counterfactual: '0.987178314', change: '0.787178313509884' },
    { id: 2, feature: 'days_since_last_quote', original: '140.99999701976776', counterfactual: '19.545776431999997', change: '-121.45422058776776' },
    { id: 3, feature: 'has_auto_insurance', original: '1', counterfactual: '0.5', change: '-0.5' },
    { id: 4, feature: 'marital_status_Married', original: '1', counterfactual: '0.1', change: '-0.9' }
  ];

  // LIME Data
  const limeData = [
    { id: 1, rule: 'purchase_likelihood <= 0.36', contribution: '0.6915' },
    { id: 2, rule: 'has_home_insurance <= 0.00', contribution: '-0.0222' },
    { id: 3, rule: 'life_event_recent_Job Change <= 0.00', contribution: '-0.0192' },
    { id: 4, rule: 'life_event_recent_Home Purchase <= 0.00', contribution: '-0.0166' },
    { id: 5, rule: 'has_umbrella_policy <= 0.00', contribution: '-0.0153' },
    { id: 6, rule: '0.34 < avg_premium_per_product <= 0.42', contribution: '-0.0146' },
    { id: 7, rule: '0.20 < customer_satisfaction_score <= 0.60', contribution: '0.0137' },
    { id: 8, rule: '0.51 < years_at_current_job <= 0.75', contribution: '0.0129' },
    { id: 9, rule: '0.24 < credit_score <= 0.49', contribution: '-0.0123' },
    { id: 10, rule: 'life_event_recent_New Baby <= 0.00', contribution: '-0.0122' }
  ];

  // SHAP Bar Plot Data
  const shapBarData = [
    { feature: 'purchase_likelihood', value: 0.095 },
    { feature: 'annual_income', value: 0.055 },
    { feature: 'age', value: 0.032 },
    { feature: 'has_life_insurance', value: 0.022 },
    { feature: 'life_event_recent_Job Change', value: 0.020 },
    { feature: 'life_event_recent_Home Purchase', value: 0.018 },
    { feature: 'has_disability_insurance', value: 0.015 },
    { feature: 'has_health_insurance', value: 0.014 },
    { feature: 'has_travel_insurance', value: 0.013 },
    { feature: 'life_event_recent_New Baby', value: 0.012 }
  ];

  // SHAP Beeswarm Data
  const generateBeeswarmData = () => {
    const features = [
      'purchase_likelihood',
      'annual_income',
      'has_life_insurance',
      'age',
      'life_event_recent_Home Purchase',
      'has_travel_insurance',
      'has_health_insurance',
      'life_event_recent_Job Change',
      'has_home_insurance',
      'Sum of 51 other features'
    ];

    return features.map((feature, idx) => {
      const points = [];
      for (let i = 0; i < 50; i++) {
        const shapValue = (Math.random() - 0.5) * (10 - idx) * 0.1;
        const featureValue = Math.random();
        points.push({
          feature,
          shapValue,
          featureValue,
          y: idx + (Math.random() - 0.5) * 0.4
        });
      }
      return points;
    }).flat();
  };

  // PDP Data for each feature
  const pdpData = {
    age: Array.from({ length: 30 }, (_, i) => {
      const x = 20 + i * 2;
      return {
        x,
        class0: 0.3 + Math.sin(i * 0.3) * 0.15,
        class1: 0.25 + Math.cos(i * 0.25) * 0.1,
        class2: 0.45 - Math.sin(i * 0.2) * 0.12
      };
    }),
    annual_income: Array.from({ length: 30 }, (_, i) => {
      const x = 30000 + i * 3000;
      return {
        x,
        class0: 0.4 - i * 0.008,
        class1: 0.2 + i * 0.005,
        class2: 0.4 + i * 0.003
      };
    }),
    credit_score: Array.from({ length: 30 }, (_, i) => {
      const x = 300 + i * 20;
      return {
        x,
        class0: 0.25 + i * 0.005,
        class1: 0.35 - i * 0.003,
        class2: 0.4 - i * 0.002
      };
    }),
    num_dependents: Array.from({ length: 6 }, (_, i) => ({
      x: i,
      class0: 0.3 + Math.random() * 0.1,
      class1: 0.25 + Math.random() * 0.1,
      class2: 0.45 + Math.random() * 0.1
    })),
    years_as_customer: Array.from({ length: 20 }, (_, i) => ({
      x: i,
      class0: 0.35 - i * 0.008,
      class1: 0.3 + i * 0.004,
      class2: 0.35 + i * 0.004
    })),
    vehicle_count: Array.from({ length: 5 }, (_, i) => ({
      x: i,
      class0: 0.3 + i * 0.02,
      class1: 0.25 - i * 0.01,
      class2: 0.45 - i * 0.01
    }))
  };

  const handleConfigureReport = () => {
    if (selectedModel) {
      setShowConfigModal(true);
    }
  };

  const handleGenerateReport = (config) => {
    if (readonly) {
      setShowConfigModal(false);
      return;
    }
    console.log('Generating report with config:', config);
    setConfigData(config);
    setShowConfigModal(false);
    setReportGenerated(true);
  };

  const handleSaveModel = (description) => {
    console.log('Saving model with description:', description);
    setShowSaveModal(false);
  };

  // Table columns for Feature Flip Summary
  const featureFlipColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'affected', label: '% Affected', sortable: true },
    { key: 'change', label: 'Avg Change', sortable: true },
    { key: 'direction', label: 'Direction', sortable: true }
  ];

  // Table columns for Counterfactual
  const counterfactualColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'feature', label: 'Feature', sortable: true },
    { key: 'original', label: 'Original', sortable: true },
    { key: 'counterfactual', label: 'Counterfactual', sortable: true },
    { key: 'change', label: 'Change', sortable: true }
  ];

  // Table columns for LIME
  const limeColumns = [
    { key: 'id', label: 'Sno', sortable: true, width: '80px' },
    { key: 'rule', label: 'Rule', sortable: true },
    { key: 'contribution', label: 'Contribution', sortable: true }
  ];

  // Beeswarm Chart Component
  const BeeswarmChart = () => {
    const data = generateBeeswarmData();
    const features = [...new Set(data.map(d => d.feature))];
    
    return (
      <div className="w-full h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 150 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="shapValue" 
              name="SHAP value"
              label={{ value: 'SHAP Value (impact on prediction)', position: 'bottom' }}
            />
            <YAxis 
              type="number" 
              dataKey="y"
              domain={[-1, features.length]}
              ticks={features.map((_, i) => i)}
              tickFormatter={(value) => features[Math.round(value)] || ''}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (payload && payload[0]) {
                  return (
                    <div className="bg-white p-2 border border-gray-300 rounded text-xs">
                      <p><strong>{payload[0].payload.feature}</strong></p>
                      <p>SHAP: {payload[0].payload.shapValue.toFixed(3)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.featureValue > 0.5 ? '#ef4444' : '#3b82f6'}
                  opacity={0.6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="absolute right-4 top-4 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
    );
  };

  // PDP Chart Component
  const PDPChart = ({ data, title, xLabel }) => (
    <div className="bg-white border border-gray-200 rounded p-3">
      <h4 className="text-sm font-medium text-gray-900 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="x" 
            label={{ value: xLabel, position: 'bottom', offset: 0 }}
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="class0" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="class1" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="class2" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <AIPlaygroundLayout>
      <div className="max-w-7xl mx-auto bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          {/* Header Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Explainability Report</h2>
            <p className="text-sm text-gray-600">
              Select a model to generate explainability insights using SHAP, PDP, LIME, and counterfactuals.
            </p>
          </div>

          {/* Controls Section */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Selection</label>
              <select
                value={selectedModel}
                onChange={(e) => !readonly && setSelectedModel(e.target.value)}
                disabled={readonly}
                className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="model1">Model 1</option>
                <option value="model2">Model 2</option>
                <option value="model3">Model 3</option>
              </select>
            </div>

            <button
              onClick={handleConfigureReport}
              disabled={!selectedModel}
              className="px-6 py-2 bg-[#8e78b7] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reportGenerated ? 'Reconfigure' : 'Configure & Generate Report'}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {showMenuDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button 
                    onClick={() => {
                      setShowMenuDropdown(false);
                      setShowGovernanceModal(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-[#8e78b7] hover:bg-gray-50 transition-colors"
                  >
                    Download Governance Report
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenuDropdown(false);
                      setShowSaveModal(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-200"
                  >
                    Save Model
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportGenerated && (
        <div className="max-w-7xl mx-auto mt-6 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Job ID</p>
                <p className="text-sm font-medium text-gray-900">Job 1234</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-medium text-gray-900">Completed</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-gray-900">01/01/2025</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">End Date</p>
                <p className="text-sm font-medium text-gray-900">01/01/2025</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Model</p>
                <p className="text-sm font-medium text-gray-900">Testing</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Version</p>
                <p className="text-sm font-medium text-gray-900">0.00001</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-gray-500 mb-1">Run ID</p>
                <p className="text-sm font-medium text-gray-900">#0123456789</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-gray-500 mb-1">Summary</p>
                <p className="text-sm text-gray-700">Explainability analysis complete. SHAP analysis successful. PDP analysis successful. Feature flip sum...</p>
              </div>
            </div>
          </div>

          {/* SHAP Bar Plot */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Bar Plot)</h3>
            <div className="bg-white border border-gray-200 rounded p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={shapBarData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    label={{ value: 'mean(|SHAP value|) (average impact on model output mag)', position: 'bottom' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="feature" 
                    width={180}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SHAP Beeswarm Plot */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Importance (SHAP Beeswarm Plot - Class 0)</h3>
            <div className="bg-white border border-gray-200 rounded p-4">
              <BeeswarmChart />
            </div>
          </div>

          {/* PDP Plots */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">PDP Plots</h3>
            <div className="grid grid-cols-3 gap-4">
              <PDPChart data={pdpData.age} title="age" xLabel="Age" />
              <PDPChart data={pdpData.annual_income} title="annual_income" xLabel="Annual Income" />
              <PDPChart data={pdpData.credit_score} title="credit_score" xLabel="Credit Score" />
              <PDPChart data={pdpData.num_dependents} title="num_dependents" xLabel="Number of Dependents" />
              <PDPChart data={pdpData.years_as_customer} title="years_as_customer" xLabel="Years as Customer" />
              <PDPChart data={pdpData.vehicle_count} title="vehicle_count" xLabel="Vehicle Count" />
            </div>
          </div>

          {/* Feature Flip Summary */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Feature Flip Summary</h3>
            <DataTable
              columns={featureFlipColumns}
              data={featureFlipData}
              isLoading={false}
              isError={false}
            />
          </div>

          {/* Counterfactual Report */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Counterfactual Report</h3>
            <DataTable
              columns={counterfactualColumns}
              data={counterfactualData}
              isLoading={false}
              isError={false}
            />
          </div>

          {/* LIME Report */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">LIME Report</h3>
            <div className="mb-4 space-y-1">
              <p className="text-sm text-gray-700"><strong>Predicted Class:</strong> 0</p>
              <p className="text-sm text-gray-700"><strong>Intercept:</strong> 0.06876408724575908</p>
            </div>
            <DataTable
              columns={limeColumns}
              data={limeData}
              isLoading={false}
              isError={false}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onGenerate={handleGenerateReport}
        initialConfig={configData}
        readonly={readonly}
      />

      <SaveModelModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveModel}
        readonly={readonly}
      />

      <GovernanceReportModal
        isOpen={showGovernanceModal}
        onClose={() => setShowGovernanceModal(false)}
      />
    </AIPlaygroundLayout>
  );
}

export default XAI;