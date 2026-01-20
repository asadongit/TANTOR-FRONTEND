import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../../../../context/AuthContext'

const AUTO_MODES = ['Swift', 'Standard', 'Comprehensive']

function Parameters({ modelData }) {
  const { token } = useAuth()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const runName = modelData?.run_name

  useEffect(() => {
    if (!runName) return
    setLoading(true)
    setError('')
    fetch(`${window._env_?.VITE_AI_API}/canvas/model/${runName}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => (res.ok ? res.json() : Promise.reject('Failed to fetch')))
      .then(setDetails)
      .catch(err => setError(typeof err === 'string' ? err : 'Error loading parameters'))
      .finally(() => setLoading(false))
  }, [runName, token])

  // --- UI helpers (professional, consistent rendering) ---
  const cx = (...a) => a.filter(Boolean).join(' ')

  const Empty = ({ title = 'No data', hint = 'Nothing to display for this section.' }) => (
    <div className="border border-dashed rounded-lg p-6 text-center bg-gray-50">
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{hint}</div>
    </div>
  )

  const Badge = ({ children, tone = 'purple' }) => (
    <span
      className={cx(
        'px-2 py-1 rounded-md text-[11px] font-medium border',
        tone === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200',
        tone === 'gray' && 'bg-gray-50 text-gray-700 border-gray-200',
        tone === 'green' && 'bg-green-50 text-green-700 border-green-200',
        tone === 'red' && 'bg-red-50 text-red-700 border-red-200'
      )}
    >
      {children}
    </span>
  )

  const StatCard = ({ title, value, sub }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{value ?? '-'}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500 break-words">{sub}</div> : null}
    </div>
  )

  const Section = ({ title, right, children }) => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )

  const KeyValueGrid = ({ data }) => {
    const entries = Object.entries(data || {}).filter(([, v]) => v !== undefined)
    if (!entries.length) return <Empty title="No fields" hint="No key/value data available." />
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500 mb-1 break-words">{k}</div>
            <div className="text-sm font-semibold text-gray-900 break-words">
              {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                ? String(v)
                : Array.isArray(v)
                  ? `${v.length} items`
                  : 'Object'}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const Badges = ({ items }) => {
    const normalized = (items || []).filter(Boolean)
    if (!normalized.length) return <Empty title="No items" hint="The list is empty." />
    return (
      <div className="flex flex-wrap gap-2">
        {normalized.map((x, i) => (
          <Badge key={`${x}-${i}`} tone="purple">
            {String(x)}
          </Badge>
        ))}
      </div>
    )
  }

  const DataTable = ({ columns, rows, getKey }) => {
    if (!rows || rows.length === 0) return <Empty title="No rows" hint="No tabular data returned." />
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map(c => (
                  <th key={c.key} className="text-left px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={getKey ? getKey(r, idx) : idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/40'}>
                  {columns.map(c => (
                    <td key={c.key} className="px-3 py-2 text-gray-800 align-top border-b border-gray-100">
                      {c.render ? c.render(r) : (r?.[c.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const ImagePanel = ({ title, base64Png, emptyHint }) => (
    <Section
      title={title}
      right={
        base64Png ? (
          <a
            href={`data:image/png;base64,${base64Png}`}
            download={`${title.replace(/\s+/g, '_').toLowerCase()}.png`}
            className="text-xs font-semibold text-purple-700 hover:text-purple-800"
          >
            Download
          </a>
        ) : null
      }
    >
      {base64Png ? (
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-3">
          <img
            src={`data:image/png;base64,${base64Png}`}
            alt={title}
            className="max-w-full rounded-lg"
          />
        </div>
      ) : (
        <Empty title="No image available" hint={emptyHint || 'This analysis did not return an image.'} />
      )}
    </Section>
  )

  const PrettyJson = ({ obj }) => {
    if (obj == null) return <Empty title="No data" hint="Nothing to render." />
    return (
      <pre className="text-[11px] leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto max-h-[420px]">
        {JSON.stringify(obj, null, 2)}
      </pre>
    )
  }

  // --- Derived state ---
  const dpMode = details?.prefill?.data_preprocessing?.request?.genesis?.data_preprocessing_mode
  const isAuto = AUTO_MODES.includes(dpMode)
  const isManual = dpMode === 'Manual'

  const manualTabs = useMemo(
    () => [
      { label: 'Data Preprocessing', key: 'genesis' },
      { label: 'Feature Selection', key: 'feature_selection' },
      { label: 'Feature Engineering', key: 'feature_engineering' },
      { label: 'Scaling & Transformation', key: 'advanced_transformation' },
      { label: 'Statistical Analysis', key: 'statistical_analysis' },
      { label: 'Feature Importance', key: 'feature_importance' },
      { label: 'Pre-processing', key: 'initial_clean' }
    ],
    []
  )

  const tabCounts = useMemo(() => {
    const counts = {}
    manualTabs.forEach(t => {
      const res = details?.prefill?.data_preprocessing?.response?.[t.key]
      if (!res) counts[t.key] = 0
      else if (Array.isArray(res)) counts[t.key] = res.length
      else if (typeof res === 'object') counts[t.key] = Object.keys(res).length
      else counts[t.key] = 1
    })
    return counts
  }, [details, manualTabs])

  if (loading) {
    return (
      <div className="py-10">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (error) return <div className="py-8 text-center text-red-600 text-sm">{error}</div>
  if (!details) return <div className="py-8 text-center text-gray-500 text-sm">No parameter data found.</div>

  function renderAutoTab() {
    const genesisConfig = details.prefill?.data_preprocessing?.request?.genesis || {}
    const availableFiles = details.available_files || []
    const meta = {
      'Model Name': details.model_name,
      Project: details.project_name,
      Dataset: details.dataset_name,
      'Workflow ID': details.workflow_id,
      'Model ID': details.model_id,
      'Project ID': details.project_id,
      'Dataset ID': details.dataset_id,
      'Storage Path': details.storage_path
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Mode" value={dpMode || '—'} sub="Data preprocessing mode" />
          <StatCard title="Run Name" value={runName || '—'} />
          <StatCard title="Files" value={availableFiles.length} sub="Available artifacts" />
          <StatCard title="Prefill Fields" value={Object.keys(genesisConfig).length} sub="Genesis config keys" />
        </div>

        <Section title="Workspace Metadata" right={<Badge tone="gray">Overview</Badge>}>
          <KeyValueGrid data={meta} />
        </Section>

        <Section
          title="Available Files"
          right={availableFiles.length ? <Badge tone="purple">{availableFiles.length}</Badge> : <Badge tone="gray">0</Badge>}
        >
          <Badges items={availableFiles} />
        </Section>

        <Section title="Prefill Summary (Genesis)" right={<Badge tone="green">Auto</Badge>}>
          <KeyValueGrid data={genesisConfig} />
        </Section>
      </div>
    )
  }

  function renderManualTab(tabKey) {
    const req = details.prefill?.data_preprocessing?.request?.[tabKey]
    const res = details.prefill?.data_preprocessing?.response?.[tabKey]

    // Shared header with request/response presence
    const headerRight = (
      <div className="flex items-center gap-2">
        <Badge tone={req ? 'green' : 'gray'}>Request {req ? '✓' : '—'}</Badge>
        <Badge tone={res ? 'green' : 'gray'}>Response {res ? '✓' : '—'}</Badge>
      </div>
    )

    if (tabKey === 'advanced_transformation') {
      const vifRows = res?.vif_report || []
      return (
        <div className="space-y-4">
          <Section title="Scaling & Transformation" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Request</div>
                <PrettyJson obj={req || {}} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response</div>
                <PrettyJson obj={{ ...res, correlation_plot: res?.correlation_plot ? '[base64 png]' : undefined }} />
              </div>
            </div>
          </Section>

          <ImagePanel
            title="Correlation Plot"
            base64Png={res?.correlation_plot}
            emptyHint="Correlation plot was not returned for this run."
          />

          <Section title="VIF Report" right={vifRows.length ? <Badge tone="purple">{vifRows.length} rows</Badge> : null}>
            <DataTable
              columns={[
                { key: 'Feature', header: 'Feature' },
                { key: 'VIF', header: 'VIF', render: r => (r?.VIF !== null && r?.VIF !== undefined ? r.VIF : '-') },
                { key: 'Multicollinearity_issue', header: 'Issue', render: r => (r?.Multicollinearity_issue ? <Badge tone="red">Yes</Badge> : <Badge tone="green">No</Badge>) },
                { key: 'Multicollinearity_Risk', header: 'Risk' }
              ]}
              rows={vifRows}
            />
          </Section>
        </div>
      )
    }

    if (tabKey === 'feature_importance') {
      const top = res?.numerical_columns || []
      return (
        <div className="space-y-4">
          <Section title="Feature Importance" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Method</div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="purple">{req?.method || '—'}</Badge>
                  {req?.sub_method ? <Badge tone="gray">{req.sub_method}</Badge> : null}
                </div>
                <div className="text-xs font-semibold text-gray-700 mt-3">Top Features</div>
                <Badges items={top} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
                <PrettyJson obj={res || {}} />
              </div>
            </div>
          </Section>
        </div>
      )
    }

    if (tabKey === 'statistical_analysis') {
      const cols = res?.numerical_columns || []
      return (
        <div className="space-y-4">
          <Section title="Statistical Analysis" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Numerical Columns</div>
                <Badges items={cols} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
                <PrettyJson obj={res || {}} />
              </div>
            </div>
          </Section>
        </div>
      )
    }

    if (tabKey === 'feature_engineering') {
      const skewEntries = res?.skewness_report ? Object.entries(res.skewness_report) : []
      return (
        <div className="space-y-4">
          <Section title="Feature Engineering" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Skewness Report</div>
                {skewEntries.length ? (
                  <DataTable
                    columns={[
                      { key: 'feature', header: 'Feature', render: r => r.feature },
                      { key: 'skew', header: 'Skewness', render: r => r.skew }
                    ]}
                    rows={skewEntries.map(([feature, skew]) => ({ feature, skew }))
                    }
                    getKey={r => r.feature}
                  />
                ) : (
                  <Empty title="No skewness report" hint="This run did not return skewness metrics." />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
                <PrettyJson obj={res || {}} />
              </div>
            </div>
          </Section>
        </div>
      )
    }

    if (tabKey === 'feature_selection') {
      const rows = res?.outlier_report || []
      return (
        <div className="space-y-4">
          <Section title="Feature Selection" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Request</div>
                <PrettyJson obj={req || {}} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
                <PrettyJson obj={res || {}} />
              </div>
            </div>
          </Section>

          <Section title="Outlier Report" right={rows.length ? <Badge tone="purple">{rows.length} rows</Badge> : null}>
            <DataTable
              columns={[
                { key: 'age', header: 'Age' },
                { key: 'gender', header: 'Gender' },
                { key: 'marital_status', header: 'Marital Status' },
                { key: 'annual_income', header: 'Annual Income' },
                { key: 'credit_score', header: 'Credit Score' },
                { key: 'num_dependents', header: 'Dependents' },
                { key: 'years_as_customer', header: 'Years as Customer' },
                { key: 'home_ownership', header: 'Home Ownership' },
                { key: 'total_products_owned', header: 'Products Owned' },
                { key: 'total_premium_amount', header: 'Total Premium' },
                {
                  key: 'outlier_columns',
                  header: 'Outlier Columns',
                  render: r => <span className="text-gray-800">{(r?.outlier_columns || []).join(', ') || '-'}</span>
                },
                {
                  key: 'outlier_details',
                  header: 'Outlier Details',
                  render: r =>
                    r?.outlier_details ? (
                      <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-md p-2 overflow-auto max-w-[420px]">
                        {JSON.stringify(r.outlier_details, null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )
                }
              ]}
              rows={rows}
            />
          </Section>
        </div>
      )
    }

    if (tabKey === 'initial_clean') {
      const uniq = res?.filtered_uniqueness_report || []
      const dropped = res?.high_cardinality_columns_dropped || []
      const missingNum = res?.missing_numeric_column || {}
      const missingCat = res?.missing_categorical_column || {}
      const missingRows = [
        ...Object.entries(missingNum).map(([column, missing]) => ({ column, missing, kind: 'numeric' })),
        ...Object.entries(missingCat).map(([column, missing]) => ({ column, missing, kind: 'categorical' }))
      ]

      return (
        <div className="space-y-4">
          <Section title="Pre-processing (Initial Clean)" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Request</div>
                <PrettyJson obj={req || {}} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
                <PrettyJson obj={res || {}} />
              </div>
            </div>
          </Section>

          <Section title="Uniqueness Report" right={uniq.length ? <Badge tone="purple">{uniq.length} rows</Badge> : null}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'uniqueness_ratio', header: 'Uniqueness Ratio' },
                { key: 'reason', header: 'Reason' }
              ]}
              rows={uniq}
            />
          </Section>

          <Section title="High Cardinality Columns Dropped" right={dropped.length ? <Badge tone="purple">{dropped.length} rows</Badge> : null}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'unique_values_count', header: 'Unique Values Count' },
                { key: 'reason', header: 'Reason' }
              ]}
              rows={dropped}
            />
          </Section>

          <Section title="Missing Value Report" right={missingRows.length ? <Badge tone="purple">{missingRows.length} rows</Badge> : null}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'kind', header: 'Type', render: r => <Badge tone="gray">{r.kind}</Badge> },
                { key: 'missing', header: 'Missing Count' }
              ]}
              rows={missingRows}
              getKey={r => `${r.kind}:${r.column}`}
            />
          </Section>
        </div>
      )
    }

    if (tabKey === 'genesis') {
      const genesisConfig = details.prefill?.data_preprocessing?.request?.genesis || {}
      return (
        <div className="space-y-4">
          <Section title="Data Preprocessing (Genesis)" right={headerRight}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Config</div>
                <KeyValueGrid data={genesisConfig} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Request (raw)</div>
                <PrettyJson obj={req || {}} />
              </div>
            </div>
          </Section>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Section title="Details" right={headerRight}>
          <Empty title="No renderer for this tab" hint="A renderer is not implemented for this section yet." />
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Request (raw)</div>
              <PrettyJson obj={req || {}} />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Response (raw)</div>
              <PrettyJson obj={res || {}} />
            </div>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">Parameters</div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">Run: {runName || '—'}</Badge>
          <Badge tone={isAuto ? 'green' : isManual ? 'purple' : 'gray'}>{dpMode || 'Unknown mode'}</Badge>
        </div>
      </div>

      {isAuto ? (
        <div className="space-y-3">
          <div className="flex border-b border-gray-200">
            <button
              className="px-4 py-2 text-sm font-semibold text-purple-700 border-b-2 border-purple-700"
              disabled
            >
              Data Pre-processing
            </button>
          </div>
          {renderAutoTab()}
        </div>
      ) : isManual ? (
        <div className="space-y-3">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {manualTabs.map((tab, idx) => {
                const active = activeTab === idx
                return (
                  <button
                    key={tab.key}
                    className={cx(
                      'shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border',
                      active
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                    onClick={() => setActiveTab(idx)}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-2 text-[11px] font-bold text-gray-500">({tabCounts[tab.key] ?? 0})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {renderManualTab(manualTabs[activeTab]?.key)}
        </div>
      ) : (
        <Empty
          title="Unknown mode"
          hint="data_preprocessing_mode is missing or not recognized. Check the prefill genesis request payload."
        />
      )}
    </div>
  )
}

export default Parameters