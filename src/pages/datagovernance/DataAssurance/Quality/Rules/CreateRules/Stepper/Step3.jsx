import React, { useMemo } from 'react';
import { useStepData } from './StepContext';

function Step3({ onBack, onCreate, step1Data, step2Data, loading, edit }) {
  const { stepData } = useStepData();
  const step1 = step1Data || stepData.step1 || {};
  const step2 = step2Data || stepData.step2 || [];

  // console.log('Step 3 Data:', step2);
  const groupStats = useMemo(() => {
    const stats = {};
    step2.forEach(rule => {
      if (!stats[rule.group]) {
        stats[rule.group] = {
          rules: 0,
          connections: 0,
          tables: new Set(),
          columns: new Set()
        };
      }
      stats[rule.group].rules += 1;

      const connections = rule.connection_details || [];
      connections.forEach(conn => {
        stats[rule.group].connections += 1;

        const tables = Array.isArray(conn.tables) ? conn.tables : (conn.tables ? [conn.tables] : []);
        tables.forEach(table => {
          stats[rule.group].tables.add(table);
        });

        const columns = Array.isArray(conn.columns) ? conn.columns : (conn.columns ? [conn.columns] : []);
        columns.forEach(column => {
          stats[rule.group].columns.add(column);
        });
      });
    });

    Object.keys(stats).forEach(group => {
      stats[group].tables = stats[group].tables.size;
      stats[group].columns = stats[group].columns.size;
    });
    return stats;
  }, [step2]);

  return (
    <div className="rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.keys(groupStats).map((group) => {
          const stats = groupStats[group];
          return (
            <div
              key={group}
              className="rounded-lg overflow-hidden"
              style={{ border: '2px solid #8d77ba' }}
            >
              <div className="flex justify-between items-center p-4" style={{ borderColor: '#8d77ba' }}>
                <h3 className="font-semibold text-lg">{group}</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="font-semibold">{stats.rules}</div>
                    <div className="text-sm text-gray-500">Rules</div>
                  </div>
                  <div>
                    <div className="font-semibold">{stats.connections}</div>
                    <div className="text-sm text-gray-500">Connections</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="font-semibold">{stats.tables}</div>
                    <div className="text-sm text-gray-500">Tables</div>
                  </div>
                  <div>
                    <div className="font-semibold">{stats.columns}</div>
                    <div className="text-sm text-gray-500">Columns</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-[#29304a] text-white">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">#</th>
              <th className="py-3 px-4 text-left font-semibold">Name</th>
              <th className="py-3 px-4 text-left font-semibold">Group</th>
              <th className="py-3 px-4 text-left font-semibold w-1/4">SQL</th>
              <th className="py-3 px-4 text-left font-semibold">Severity</th>
              <th className="py-3 px-4 text-left font-semibold">Status</th>
              <th className="py-3 px-4 text-left font-semibold">Owner</th>
              <th className="py-3 px-4 text-left font-semibold">Connection</th>
              <th className="py-3 px-4 text-left font-semibold">Schema</th>
              <th className="py-3 px-4 text-left font-semibold">Table</th>
              <th className="py-3 px-4 text-left font-semibold">Column</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {step2.map((rule, index) => {
              const connections = rule.connection_details || [];
              return (connections.length ? connections : [{}]).map((conn, connIndex) => (
                <tr key={`${rule.rule?.id || rule.rule?.name || index}-${connIndex}`} className="hover:bg-gray-50">
                  {connIndex === 0 && (
                    <>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>{index + 1}</td>
                      <td className="py-3 px-4 align-top font-medium text-[#8d77ba]" rowSpan={connections.length || 1}>{rule.rule?.name}</td>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>{rule.group}</td>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>
                        <div className="max-h-20">
                          <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                            {rule.rule?.query || "No SQL defined"}
                          </pre>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>
                        {rule.rule?.severity || "-"}
                      </td>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>
                        {rule.rule?.status || "-"}
                      </td>
                      <td className="py-3 px-4 align-top" rowSpan={connections.length || 1}>
                        {rule.rule?.owner || "-"}
                      </td>
                    </>
                  )}
                  <td className="py-3 px-4">{conn.connection || "-"}</td>
                  <td className="py-3 px-4">
                    {Array.isArray(conn.schema)
                      ? conn.schema.join(', ')
                      : (conn.schema || "-")}
                  </td>
                  <td className="py-3 px-4">
                    {Array.isArray(conn.tables)
                      ? conn.tables.join(', ')
                      : (conn.tables || "-")}
                  </td>
                  <td className="py-3 px-4">
                    {Array.isArray(conn.columns)
                      ? conn.columns.join(', ')
                      : (conn.columns || "-")}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-8 gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={!!edit || loading}
        >
          Back
        </button>
        <button
          onClick={() => {
            onCreate(step2, step1);
          }}
          className="px-6 py-2 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7a67a0] transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          ) : null}
          {loading ? (edit ? 'Updating...' : 'Creating...') : (edit ? 'Update' : 'Create')}
        </button>
      </div>
    </div>
  );
}

export default Step3;