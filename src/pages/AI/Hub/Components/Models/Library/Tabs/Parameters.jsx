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

  const NoteBar = ({ children }) => (
    <div className="border border-purple-200 bg-purple-50 text-purple-700 rounded-lg px-4 py-3 text-xs">
      {children}
    </div>
  )

  const PGSection = ({ title, description, right, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {description ? <div className="text-[11px] text-gray-500 mt-0.5">{description}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )

  const PGToggler = ({ on }) => (
    <div
      className={cx(
        'w-10 h-6 rounded-full relative border transition-colors',
        on ? 'bg-purple-600 border-purple-600' : 'bg-gray-100 border-gray-200'
      )}
      aria-hidden="true"
    >
      <div
        className={cx(
          'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </div>
  )

  const Chip = ({ children }) => (
    <span className="px-2 py-1 rounded-md text-[11px] border border-gray-200 bg-gray-50 text-gray-700">
      {children}
    </span>
  )

  const ChipsWrap = ({ items }) => {
    const arr = (items || []).filter(Boolean)
    if (!arr.length) return <div className="text-xs text-gray-400">—</div>
    return <div className="flex flex-wrap gap-2">{arr.map((x, i) => <Chip key={`${x}-${i}`}>{String(x)}</Chip>)}</div>
  }

  const PGField = ({ label, hint, children }) => (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      {hint ? <div className="text-[11px] text-gray-500">{hint}</div> : null}
      <div>{children}</div>
    </div>
  )

  const ReadOnlySelect = ({ value, placeholder = '—' }) => (
    <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs flex items-center text-gray-800">
      {value !== undefined && value !== null && String(value).trim() !== '' ? (
        String(value)
      ) : (
        <span className="text-gray-400">{placeholder}</span>
      )}
    </div>
  )

  const RadioRow = ({ label, checked }) => (
    <div className="flex items-center gap-2 py-2">
      <div
        className={cx(
          'w-4 h-4 rounded-full border flex items-center justify-center',
          checked ? 'border-purple-600' : 'border-gray-300'
        )}
      >
        {checked ? <div className="w-2 h-2 rounded-full bg-purple-600" /> : null}
      </div>
      <div className={cx('text-xs', checked ? 'text-gray-900 font-semibold' : 'text-gray-700')}>{label}</div>
    </div>
  )

  // --- Missing helpers used by Manual tabs ---
  const TogglePill = ({ on }) => (
    <Badge tone={on ? 'green' : 'gray'}>{on ? 'Enabled' : 'Disabled'}</Badge>
  )

  const FieldRow = ({ label, value, hint }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-700">{label}</div>
        {hint ? <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div> : null}
      </div>
      <div className="text-xs text-gray-900 text-right break-words max-w-[62%]">{value}</div>
    </div>
  )

  const SummaryCard = ({ title, children, right }) => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )

  const Collapsible = ({ title, defaultOpen = false, right, children }) => {
    const [open, setOpen] = useState(defaultOpen)
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="flex items-center gap-2">
            {right ? right : null}
            <span className="text-xs text-gray-500">{open ? 'Hide' : 'Show'}</span>
          </div>
        </button>
        {open ? <div className="p-4">{children}</div> : null}
      </div>
    )
  }

  const formatValue = v => {
    if (v === undefined) return undefined
    if (v === null) return '—'
    if (typeof v === 'boolean') return <TogglePill on={v} />
    if (typeof v === 'number') return String(v)
    if (typeof v === 'string') return v || '—'
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
    if (typeof v === 'object') return <span className="text-gray-600">Object</span>
    return String(v)
  }

  const isEmptyValue = v => {
    if (v === undefined || v === null) return true
    if (typeof v === 'string') return v.trim() === ''
    if (Array.isArray(v)) return v.length === 0
    if (typeof v === 'object') return Object.keys(v).length === 0
    return false
  }

  // Playground-like request summary (per manual tab)
  const RequestSelections = ({ tabKey, req }) => {
    const [showAll, setShowAll] = useState(false)

    const genesis = details?.prefill?.data_preprocessing?.request?.genesis || {}
    const session = genesis?.session_id

    const rows = useMemo(() => {
      const r = req || {}
      const base = []
      const add = (label, value, hint) => {
        if (!showAll && isEmptyValue(value)) return
        base.push({ label, value, hint })
      }

      add('Session ID', session, 'Playground session id')
      if (tabKey !== 'genesis') add('Step', tabKey, 'Manual pipeline step')

      if (tabKey === 'genesis') {
        add('Target column', r?.target_column, 'What model predicts')
        add('Modelling type', r?.modelling_type, 'binary / multiclass / regression')
        add('Train size', r?.train_size)
        add('Test size', r?.test_size)
        add('Random state', r?.random_state)
        add('Fairness columns', r?.fairness_columns, 'Columns used for fairness checks')
        add('Data preprocessing mode', r?.data_preprocessing_mode)
        add('Model mode', r?.model_mode)
      }

      if (tabKey === 'initial_clean') {
        add('Modify data types', r?.modify_data_types)
        add('Modify dtypes map', r?.modify_data_types_map)
        add('Drop columns', r?.drop_columns_active)
        add('Columns to drop', r?.drop_columns)
        add('Drop duplicate rows', r?.drop_duplicates_rows)
        add('Missing value indicator', r?.missing_value_indicator)
        add('Indicator columns', r?.missing_value_indicator_cols)
        add('Uniqueness filter', r?.uniqueness_filter_active)
        add('Uniqueness lower threshold', r?.uniqueness_lower_threshold)
        add('Uniqueness upper threshold', r?.uniqueness_upper_threshold)
      }

      if (tabKey === 'feature_selection') {
        add('Drop high uniqueness', r?.drop_high_uniqueness_active)
        add('Columns to drop manually', r?.columns_to_drop_manually)
        add('Drop high null', r?.drop_high_null_active)
        add('Null threshold', r?.null_threshold)
        add('Imputation (by type)', r?.imputation_strategy_by_type)
        add('Imputation (by column)', r?.imputation_strategy_by_column)
        add('Feature creation', r?.feature_creation_active)
        add('Math ops', r?.math_ops)
        add('Cyclical cols', r?.cyclical_cols)
        add('Outlier detection', r?.outlier_detection_active)
        add('Outlier method', r?.outlier_detection_method)
      }

      if (tabKey === 'feature_engineering') {
        add('Outlier treatment', r?.outlier_treatment)
        add('Outlier treatment strategy', r?.outlier_treatment_strategy)
        add('Outlier threshold', r?.outlier_threshold)
        add('Categorical encoding', r?.categorical_encoding)
        add('Encoding method', r?.categorical_encoding_method)
        add('Encoding base', r?.categorical_encoding_base)
      }

      if (tabKey === 'advanced_transformation') {
        add('Advanced transformation', r?.advanced_transformation)
        add('Columns to transform', r?.columns_to_transform)
        add('Transformation method', r?.transformation_method)
        add('Near zero variance filter', r?.near_zero_variance_filter)
        add('Feature scaler', r?.feature_scaler)
        add('Scaler method', r?.feature_scaler_method)
      }

      if (tabKey === 'statistical_analysis') {
        add('VIF column dropper', r?.vif_column_dropper)
        add('VIF columns to drop', r?.vif_columns_to_drop)
      }

      if (tabKey === 'feature_importance') {
        add('Feature importance selection', r?.feature_importance_selection)
        add('Method', r?.method)
        add('Sub-method', r?.sub_method)
        add('Number of features', r?.n_features)
        add('Dimensionality reduction', r?.dimensionality_reduction)
        add('Reduction method', r?.dimensionality_reduction_method)
        add('N components', r?.n_components)
      }

      // if (tabKey === 'imbalance_handling') {
      //   add('Imbalance handling', r?.imbalance_handling)
      //   add('Method', r?.imbalance_handling_method)
      //   add('Use class weights', r?.use_class_weights)
      //   add('Sampling strategy', r?.sampling_strategy)
      // }

      return base
    }, [req, tabKey, showAll, session])

    return (
      <SummaryCard
        title="Selected settings"
        right={
          <button
            type="button"
            onClick={() => setShowAll(s => !s)}
            className="text-xs font-semibold text-purple-700 hover:text-purple-800"
          >
            {showAll ? 'Show less' : 'Show all'}
          </button>
        }
      >
        {rows.length ? (
          <div className="flex flex-col">
            {rows.map(r => (
              <FieldRow key={r.label} label={r.label} hint={r.hint} value={formatValue(r.value) ?? '—'} />
            ))}
          </div>
        ) : (
          <Empty title="No selections" hint="No request settings were found for this step." />
        )}
      </SummaryCard>
    )
  }

  // --- Derived state ---
  const dpMode = details?.prefill?.data_preprocessing?.request?.genesis?.data_preprocessing_mode
  const isAuto = AUTO_MODES.includes(dpMode)
  const isManual = dpMode === 'Manual'

  const manualTabs = useMemo(
    () => [
      { label: 'Data Preprocessing', key: 'genesis' },
      { label: 'Pre-processing', key: 'initial_clean' },
      { label: 'Feature Selection', key: 'feature_selection' },
      { label: 'Feature Engineering', key: 'feature_engineering' },
      { label: 'Scaling & Transformation', key: 'advanced_transformation' },
      { label: 'Statistical Analysis', key: 'statistical_analysis' },
      { label: 'Feature Importance', key: 'feature_importance' },
      { label: 'Imbalance Handling', key: 'imbalance_handling' }
    ],
    []
  )

  const autoTabs = useMemo(() => [manualTabs[0]], [manualTabs])

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
    const req = details.prefill?.data_preprocessing?.request?.[tabKey] || {}
    const res = details.prefill?.data_preprocessing?.response?.[tabKey] || {}

    const headerRight = (
      <div className="flex items-center gap-2">
        <Badge tone={Object.keys(req).length ? 'green' : 'gray'}>Config</Badge>
        <Badge tone={Object.keys(res).length ? 'green' : 'gray'}>Result</Badge>
      </div>
    )

    const note = (
      <NoteBar>
        <span className="font-semibold">Note:</span> This view displays the pre-processing configuration applied to the model.
        The settings shown here are read-only and cannot be edited.
      </NoteBar>
    )

    if (tabKey === 'genesis') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection title="Dataset Configuration" description="Basic setup for the model training.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Target column" hint="The column the model will predict">
                <ReadOnlySelect value={req.target_column} placeholder="—" />
              </PGField>

              <PGField label="Modelling type" hint="Type of prediction task">
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {['binary', 'multiclass', 'regression'].map(k => (
                    <RadioRow
                      key={k}
                      label={k.charAt(0).toUpperCase() + k.slice(1)}
                      checked={String(req.modelling_type || '').toLowerCase() === k}
                    />
                  ))}
                </div>
              </PGField>

              <PGField label="Train size">
                <ReadOnlySelect value={req.train_size} placeholder="—" />
              </PGField>

              <PGField label="Test size">
                <ReadOnlySelect value={req.test_size} placeholder="—" />
              </PGField>

              <PGField label="Random state">
                <ReadOnlySelect value={req.random_state} placeholder="—" />
              </PGField>

              <PGField label="Fairness columns" hint="Columns for fairness analysis">
                <ChipsWrap items={req.fairness_columns} />
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Processing Mode" description="Choose between auto or manual preprocessing.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Data preprocessing mode">
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {['Manual', 'Swift', 'Standard', 'Comprehensive'].map(k => (
                    <RadioRow
                      key={k}
                      label={k}
                      checked={String(req.data_preprocessing_mode || '').toLowerCase() === k.toLowerCase()}
                    />
                  ))}
                </div>
              </PGField>

              <PGField label="Model mode">
                <ReadOnlySelect value={req.model_mode} placeholder="—" />
              </PGField>
            </div>
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'initial_clean') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection title="Data Type Modifications" description="Adjust column data types.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Modify data types">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.modify_data_types} />
                </div>
              </PGField>

              <PGField label="Data type map" hint="Per-column type overrides">
                <ReadOnlySelect value={req.modify_data_types_map ? 'Configured' : ''} placeholder="Not configured" />
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Column Dropping" description="Remove unwanted columns.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Drop columns">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.drop_columns_active} />
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-gray-500 mb-1">Columns to drop</div>
                  <ChipsWrap items={req.drop_columns} />
                </div>
              </PGField>

              <PGField label="Drop duplicate rows">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.drop_duplicates_rows} />
                </div>
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Missing Value Indicators" description="Add flags for missing values.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Missing value indicator">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.missing_value_indicator} />
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-gray-500 mb-1">Indicator columns</div>
                  <ChipsWrap items={req.missing_value_indicator_cols} />
                </div>
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Uniqueness Filter" description="Drop columns based on uniqueness.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Uniqueness filter">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.uniqueness_filter_active} />
                </div>
              </PGField>

              <PGField label="Lower threshold">
                <ReadOnlySelect value={req.uniqueness_lower_threshold} placeholder="—" />
              </PGField>

              <PGField label="Upper threshold">
                <ReadOnlySelect value={req.uniqueness_upper_threshold} placeholder="—" />
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Uniqueness Report" right={headerRight}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'uniqueness_ratio', header: 'Uniqueness Ratio' },
                { key: 'reason', header: 'Reason' }
              ]}
              rows={res?.filtered_uniqueness_report || []}
            />
          </PGSection>

          <PGSection title="High Cardinality Columns Dropped" right={headerRight}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'unique_values_count', header: 'Unique Values Count' },
                { key: 'reason', header: 'Reason' }
              ]}
              rows={res?.high_cardinality_columns_dropped || []}
            />
          </PGSection>

          <PGSection title="Missing Value Report" right={headerRight}>
            <DataTable
              columns={[
                { key: 'column', header: 'Column' },
                { key: 'kind', header: 'Type', render: r => <Badge tone="gray">{r.kind}</Badge> },
                { key: 'missing', header: 'Missing Count' }
              ]}
              rows={[
                ...Object.entries(res?.missing_numeric_column || {}).map(([column, missing]) => ({ column, missing, kind: 'numeric' })),
                ...Object.entries(res?.missing_categorical_column || {}).map(([column, missing]) => ({ column, missing, kind: 'categorical' }))
              ]}
              getKey={r => `${r.kind}:${r.column}`}
            />
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'feature_selection') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection
            title="Drop Low-Value Columns"
            description="Remove columns with zero or excessively high uniqueness."
            right={<PGToggler on={!!req.drop_high_uniqueness_active || !!req.drop_high_null_active} />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PGField label="Columns to drop (manual)">
                <ChipsWrap items={req.columns_to_drop_manually} />
              </PGField>

              <PGField label="High null filter" hint="Drop columns above null threshold">
                <div className="space-y-2">
                  <RadioRow label="Disabled" checked={!req.drop_high_null_active} />
                  <RadioRow label="Enabled" checked={!!req.drop_high_null_active} />
                  <div className="pt-1">
                    <div className="text-[11px] text-gray-500 mb-1">Null threshold</div>
                    <ReadOnlySelect value={req.null_threshold} />
                  </div>
                </div>
              </PGField>

              <PGField label="High uniqueness filter" hint="Drop columns beyond uniqueness threshold">
                <div className="space-y-2">
                  <RadioRow label="Disabled" checked={!req.drop_high_uniqueness_active} />
                  <RadioRow label="Enabled" checked={!!req.drop_high_uniqueness_active} />
                </div>
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Handle Missing Values" description="Fix missing entries using dropping or imputation techniques.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PGField label="Imputation (by type)">
                <ReadOnlySelect value={req.imputation_strategy_by_type ? 'Configured' : ''} placeholder="Not configured" />
              </PGField>

              <PGField label="Imputation (by column)">
                <ReadOnlySelect value={req.imputation_strategy_by_column ? 'Configured' : ''} placeholder="Not configured" />
              </PGField>

              <PGField label="Outlier Detection" hint="Detect outliers as part of feature selection">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.outlier_detection_active} />
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-gray-500 mb-1">Method</div>
                  <ReadOnlySelect value={req.outlier_detection_method} placeholder="—" />
                </div>
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Outlier Report" right={headerRight}>
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
                      <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-md p-2 overflow-auto max-w-[520px]">
                        {JSON.stringify(r.outlier_details, null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )
                }
              ]}
              rows={res?.outlier_report || []}
            />
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'feature_engineering') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection
            title="Outlier Treatment"
            description="Handle outliers detected in your dataset."
            right={<PGToggler on={!!req.outlier_treatment} />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Treatment strategy">
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {['remove', 'cap_95', 'log_transform', 'sqrt_transform', 'normalize'].map(k => (
                    <div key={k} className="px-3">
                      <RadioRow
                        label={
                          k === 'remove'
                            ? 'Remove'
                            : k === 'cap_95'
                              ? 'Cap 95%'
                              : k === 'log_transform'
                                ? 'Log Transform'
                                : k === 'sqrt_transform'
                                  ? 'Square Root Transform'
                                  : 'Normalize'
                        }
                        checked={String(req.outlier_treatment_strategy || '').toLowerCase() === k}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-gray-500 mb-1">Threshold</div>
                  <ReadOnlySelect value={req.outlier_threshold} />
                </div>
              </PGField>

              <PGField label="Categorical Encoding" hint="Encode categorical features for modelling">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.categorical_encoding} />
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-gray-500 mb-1">Encoding method</div>
                  <ReadOnlySelect value={req.categorical_encoding_method} placeholder="—" />
                </div>
                <div className="mt-3">
                  <div className="text-[11px] text-gray-500 mb-1">Encoding base</div>
                  <ReadOnlySelect value={req.categorical_encoding_base} placeholder="—" />
                </div>
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Skewness report" right={headerRight}>
            <DataTable
              columns={[
                { key: 'feature', header: 'Feature', render: r => r.feature },
                { key: 'skew', header: 'Skewness', render: r => r.skew }
              ]}
              rows={Object.entries(res?.skewness_report || {}).map(([feature, skew]) => ({ feature, skew }))}
              getKey={r => r.feature}
            />
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'advanced_transformation') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection title="Correlation Graphs" description="Feature relationship visualization" right={headerRight}>
            <ImagePanel
              title="Correlation Plot"
              base64Png={res?.correlation_plot}
              emptyHint="Correlation plot was not returned for this run."
            />
          </PGSection>

          <PGSection title="VIF analysis" description="Detect multicollinearity across features.">
            <DataTable
              columns={[
                { key: 'Feature', header: 'Feature' },
                { key: 'VIF', header: 'VIF', render: r => (r?.VIF !== null && r?.VIF !== undefined ? r.VIF : '-') },
                {
                  key: 'Multicollinearity_issue',
                  header: 'Issue',
                  render: r => (r?.Multicollinearity_issue ? <Badge tone="red">Yes</Badge> : <Badge tone="green">No</Badge>)
                },
                { key: 'Multicollinearity_Risk', header: 'Risk' }
              ]}
              rows={res?.vif_report || []}
            />
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'statistical_analysis') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection
            title="What's Included?"
            description={
              <div className="text-[11px] text-gray-600">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Correlation heatmap to show feature relationships</li>
                  <li>VIF analysis to detect multicollinearity</li>
                  <li>VIF column dropper to remove problematic features</li>
                  <li>Risk assessment for each feature</li>
                </ul>
              </div>
            }
          >
            <div />
          </PGSection>

          <PGSection title="Numerical Columns" right={headerRight}>
            <Badges items={res?.numerical_columns || []} />
          </PGSection>
        </div>
      )
    }

    if (tabKey === 'feature_importance') {
      return (
        <div className="space-y-4">
          {note}

          <PGSection title="Feature Importance Selection" description="Select features based on importance.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Feature importance selection">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.feature_importance_selection} />
                </div>
              </PGField>

              <PGField label="Method">
                <ReadOnlySelect value={req.method} placeholder="—" />
              </PGField>

              <PGField label="Sub-method">
                <ReadOnlySelect value={req.sub_method} placeholder="—" />
              </PGField>

              <PGField label="Number of features">
                <ReadOnlySelect value={req.n_features} placeholder="—" />
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Dimensionality Reduction" description="Reduce feature dimensions.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PGField label="Dimensionality reduction">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
                  <div className="text-xs text-gray-700">Enabled</div>
                  <PGToggler on={!!req.dimensionality_reduction} />
                </div>
              </PGField>

              <PGField label="Reduction method">
                <ReadOnlySelect value={req.dimensionality_reduction_method} placeholder="—" />
              </PGField>

              <PGField label="N components">
                <ReadOnlySelect value={req.n_components} placeholder="—" />
              </PGField>
            </div>
          </PGSection>

          <PGSection title="Top Features" right={headerRight}>
            <Badges items={res?.numerical_columns || []} />
          </PGSection>
        </div>
      )
    }

    // if (tabKey === 'imbalance_handling') {
    //   return (
    //     <div className="space-y-4">
    //       {note}

    //       <PGSection title="Imbalance Handling" description="Address class imbalance in the dataset.">
    //         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    //           <PGField label="Imbalance handling">
    //             <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
    //               <div className="text-xs text-gray-700">Enabled</div>
    //               <PGToggler on={!!req.imbalance_handling} />
    //             </div>
    //           </PGField>

    //           <PGField label="Method">
    //             <ReadOnlySelect value={req.imbalance_handling_method} placeholder="—" />
    //           </PGField>

    //           <PGField label="Use class weights">
    //             <div className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 px-3 h-10">
    //               <div className="text-xs text-gray-700">Enabled</div>
    //               <PGToggler on={!!req.use_class_weights} />
    //             </div>
    //           </PGField>

    //           <PGField label="Sampling strategy">
    //             <ReadOnlySelect value={req.sampling_strategy} placeholder="—" />
    //           </PGField>
    //         </div>
    //       </PGSection>

    //       <PGSection title="Data Preview (after imbalance handling)" right={headerRight}>
    //         <PrettyJson obj={res?.cleaned_df_preview || []} />
    //       </PGSection>
    //     </div>
    //   )
    // }

    // Default fallback: show nothing except note + a small empty (no raw JSON)
    return (
      <div className="space-y-4">
        {note}
        <Empty title="No Playground view yet" hint="This step has no dedicated UI yet." />
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

      {(isAuto || isManual) ? (
        <div className="space-y-3">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {(isAuto ? autoTabs : manualTabs).map((tab, idx) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === idx
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-[11px] font-semibold text-gray-500">
                    ({tabCounts[tab.key] ?? 0})
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {renderManualTab((isAuto ? autoTabs : manualTabs)[activeTab]?.key)}
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