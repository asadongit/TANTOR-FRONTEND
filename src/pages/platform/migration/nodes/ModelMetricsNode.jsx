  import React, { useState, useEffect } from 'react';
  import PropTypes from 'prop-types';
  import { Handle, Position, useEdges, useNodes, useReactFlow } from 'reactflow';
  import { LineChart, X } from 'lucide-react';
  import { useCSV } from '../context/CSVcontext';
  import { createPortal } from 'react-dom';
  import PerformanceChart from './components/PerformanceChart';

  const findDefineNode = (nodes, edges, startNodeId) => {
    const visited = new Set();
    const queue = [startNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodes.find(n => n.id === currentId);
      if (node?.type === 'supervisedMl') {
        return node;
      }

      const incomingEdges = edges.filter(e => e.target === currentId);
      queue.push(...incomingEdges.map(e => e.source));
    }

    return null;
  };

  const Modal = ({ onClose, children }) => {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-gray-800 p-6 rounded-lg w-[1200px] max-h-[80vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div >
          {children}

          </div>
        </div>
      </div>,
      document.body
    );
  };



  export function ModelMetricsNode({ id }) {
    const edges = useEdges();
    const nodes = useNodes();
    const { getData } = useCSV();

    const incomingEdge = edges.find(edge => edge.target === id);
    const DefineNode = incomingEdge ? findDefineNode(nodes, edges, id) : null;
    const AlgoResponse = DefineNode ? getData(DefineNode.id) || [] : [];

    const [selectedAlgo, setSelectedAlgo] = useState(null);
    const [modalAlgo, setModalAlgo] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
      if (showModal && selectedAlgo) {
        setModalAlgo(selectedAlgo);
      }
    }, [showModal, selectedAlgo]);

    const handleAlgoSelect = (e) => {
      setSelectedAlgo(e.target.value);
    };

    const handleModalAlgoSelect = (e) => {
      setModalAlgo(e.target.value);
    };

    const selectedAlgoData = AlgoResponse?.supervisedApiData?.results?.[selectedAlgo] || {};
    const fairnessPlots = AlgoResponse?.supervisedApiData?.fairness_plots || {};
    const radarCharts = AlgoResponse?.supervisedApiData?.radar_plots || {};
    const rocAuc = AlgoResponse?.supervisedApiData?.roc_auc || {};

    const formatValue = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toFixed(6);
    };

    const toggleModal = () => {
      setShowModal(!showModal);
    };

    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-700 min-w-[300px] relative group">
        <button
          onClick={() => window.deleteNode?.(id)}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <Handle type="target" position={Position.Left} />

        <div className="flex items-center space-x-3 mb-3">
          <LineChart className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">Model Metrics</h3>
        </div>

        <div className="mb-3 font-small">
          <select
            value={selectedAlgo || ''}
            onChange={handleAlgoSelect}
            className="w-full bg-gray-700 text-white rounded p-2 text-sm"
          >
            <option value="" disabled>Select an Algorithm</option>
            {Object.keys(AlgoResponse?.supervisedApiData?.results || {}).map(algoName => (
              <option key={algoName} value={algoName}>
                {algoName}
              </option>
            ))}
          </select>
        </div>

        {selectedAlgo && (
          <>
            <div className="text-white mt-4">
              {/* <h4 className="font-semibold text-blue-300">{selectedAlgo}</h4> */}
              <div className="mt-2">
              <h5 className="font-medium">Performance Metrics:</h5>
              <table className="table-auto w-full text-sm mt-2 bg-gray-700 rounded">
                <tbody>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">Accuracy</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.accuracy)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">Precision</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.precision)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">Recall</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.recall)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">F1 Score</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.f1)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">Log Loss</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.log_loss)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">ROC AUC</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.roc_auc)}</td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-600 p-2 font-semibold">Execution Time</td>
                    <td className="border-b border-gray-600 p-2">{formatValue(selectedAlgoData.performance?.execution_time)} s</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <h5 className="font-medium">Confusion Matrix:</h5>
              <div className="grid grid-cols-2 gap-1 w-1/2 bg-gray-700 p-2 rounded">
                {selectedAlgoData.performance?.confusion_matrix?.length === 2 &&
                selectedAlgoData.performance.confusion_matrix[0].length === 2 ? (
                  selectedAlgoData.performance.confusion_matrix.map((row, rowIndex) =>
                    row.map((value, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="flex items-center justify-center p-2 border border-gray-600 text-white text-sm"
                      >
                        {value ?? 'N/A'}
                      </div>
                    ))
                  )
                ) : (
                  <>
                    <div className="flex items-center justify-center p-2 border border-gray-600 text-white text-sm">N/A</div>
                    <div className="flex items-center justify-center p-2 border border-gray-600 text-white text-sm">N/A</div>
                    <div className="flex items-center justify-center p-2 border border-gray-600 text-white text-sm">N/A</div>
                    <div className="flex items-center justify-center p-2 border border-gray-600 text-white text-sm">N/A</div>
                  </>
                )}
              </div>
            </div>
            </div>

            <div className="absolute bottom-3 right-3">
              <button
                onClick={toggleModal}
                className="text-blue-400 bg-gray-700 rounded px-3 py-1 text-sm hover:bg-gray-600"
              >
                More
              </button>
            </div>
          </>
        )}

        {showModal && (
          <Modal onClose={toggleModal}>
            <div className="text-white">
              <div className="mb-6">
              <h2 className="font-small">Select an Algorithm</h2>
                <select
                  value={modalAlgo || ''}
                  onChange={handleModalAlgoSelect}
                  className="w-1/2 bg-gray-700 text-white rounded p-2 mt-2"
                >
                  <option value="" disabled>Select</option>
                  {Object.keys(AlgoResponse?.supervisedApiData?.results || {}).map(algoName => (
                    <option key={algoName} value={algoName}>
                      {algoName}
                    </option>
                  ))}
                </select>
              </div>

              {modalAlgo && (
                <div className="space-y-8">

<PerformanceChart
      performanceData={AlgoResponse?.supervisedApiData?.results[modalAlgo]?.performance}
    />

                  {fairnessPlots[modalAlgo] && (
                    <div>
                      <h4 className="text-lg mb-2">Fairness Plot</h4>
                      <img
                        src={`data:image/png;base64,${fairnessPlots[modalAlgo]}`}
                        alt={`${modalAlgo} Fairness Plot`}
                        className="w-full rounded"
                      />
                    </div>
                  )}

                  {radarCharts[modalAlgo] && (
                    <div>
                      <h4 className="text-lg mb-2">Radar Chart</h4>
                      <img
                        src={`data:image/png;base64,${radarCharts[modalAlgo]}`}
                        alt={`${modalAlgo} Radar Chart`}
                        className="w-full rounded"
                      />
                    </div>
                  )}

                  {rocAuc[modalAlgo] && (
                    <div>
                      <h4 className="text-lg mb-2">ROC AUC Curve</h4>
                      <img
                        src={`data:image/png;base64,${rocAuc[modalAlgo]}`}
                        alt={`${modalAlgo} ROC AUC Curve`}
                        className="w-full rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  Modal.propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
  };

  ModelMetricsNode.propTypes = {
    id: PropTypes.string.isRequired
  };

  export default ModelMetricsNode;