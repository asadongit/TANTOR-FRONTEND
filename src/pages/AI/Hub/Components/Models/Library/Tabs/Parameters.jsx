import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../../../../../context/AuthContext'
import { useAIPlayground } from '../../../../../../../context/AIPlaygroundContext'
import DataCleaning from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/DataCleaning'
import FeatureSelection from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/FeatureSelection'
import FeatureEngineering from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/FeatureEngineering'
import ScalingTransformation from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/ScalingTransformation'
import StatisticalAnalysis from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/StatisticalAnalysis'
import FeatureImportance from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/FeatureImportance'
import Step7 from '../../../../../AIPlayground/Stages/DataPreprocessing/Steps/Step7'

const AUTO_MODES = ['Swift', 'Standard', 'Comprehensive']

function Parameters({ modelData }) {
  const { token } = useAuth()
  const { setWorkflowState, setMode } = useAIPlayground()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const runName = modelData?.run_name

  useEffect(() => {
    if (!runName) return

    const controller = new AbortController()
    let alive = true

    const safeReadText = async (res) => {
      try {
        return await res.text()
      } catch {
        return ''
      }
    }

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const baseUrl = window._env_?.VITE_AI_API
        if (!baseUrl) throw new Error('VITE_AI_API is not configured')

        // Fetch model details
        const modelRes = await fetch(`${baseUrl}/canvas/model/${encodeURIComponent(runName)}`, {
          headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
          signal: controller.signal
        })
        if (!modelRes.ok) {
          const body = await safeReadText(modelRes)
          throw new Error(`Failed to fetch model details (${modelRes.status}). ${body?.slice(0, 200)}`)
        }
        const fetchedModel = await modelRes.json()
        if (!alive) return
        setDetails(fetchedModel)

        // Set workflow state if prefill data exists
        if (fetchedModel?.prefill) {
          const newWorkflowState = {
            modelGenesis: {
              config: fetchedModel.prefill?.data_preprocessing?.request?.genesis || null,
              apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.genesis || null
            },
            dataPreprocessing: {
              step1: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.initial_clean || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.initial_clean || null
              },
              step2: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.feature_selection || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.feature_selection || null
              },
              step3: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.feature_engineering || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.feature_engineering || null
              },
              step4: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.advanced_transformation || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.advanced_transformation || null
              },
              step5: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.statistical_analysis || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.statistical_analysis || null
              },
              step6: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.feature_importance || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.feature_importance || null
              },
              step7: {
                config: fetchedModel.prefill?.data_preprocessing?.request?.imbalance_handling || null,
                apiResponse: fetchedModel.prefill?.data_preprocessing?.response?.imbalance_handling || null
              }
            },
            modelSelection: {
              config: fetchedModel.prefill?.training?.request || null,
              apiResponse: fetchedModel.prefill?.training?.response || null
            },
            modelInferencing: { config: null, apiResponse: null },
            xai: { config: null, apiResponse: null },
            modelDeployment: { config: null, apiResponse: null }
          }

          setWorkflowState(newWorkflowState)
          setMode('view')
        }
      } catch (e) {
        if (!alive) return
        if (e?.name === 'AbortError') return
        setError(e?.message || 'Error loading parameters')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
      controller.abort()
    }
  }, [runName, token, setWorkflowState, setMode])

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
      { label: 'Data Preprocessing', key: 'initial_clean' },
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

    // Render the corresponding DataPreprocessing step component for each tabKey
    const renderStep = () => {
      switch (tabKey) {
        case 'initial_clean':
          return <DataCleaning onValidationChange={() => {}} onApiCall={() => {}} />
        case 'feature_selection':
          return <FeatureSelection onValidationChange={() => {}} onApiCall={() => {}} />
        case 'feature_engineering':
          return <FeatureEngineering onValidationChange={() => {}} onApiCall={() => {}} />
        case 'advanced_transformation':
          return <ScalingTransformation onValidationChange={() => {}} onApiCall={() => {}} />
        case 'statistical_analysis':
          return <StatisticalAnalysis onValidationChange={() => {}} onApiCall={() => {}} />
        case 'feature_importance':
          return <FeatureImportance onValidationChange={() => {}} onApiCall={() => {}} />
        case 'imbalance_handling':
          return <Step7 showPreview={false} onApiCall={() => {}} />
        default:
          return <Empty title="No Playground view yet" hint="This step has no dedicated UI yet." />
      }
    }

    return (
      <div className="space-y-4">
        {note}
        {renderStep()}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
      </div>

      {isAuto ? (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
            <div className="text-sm" style={{ color: '#8E77BB' }}>
              Data is preprocessed by <span className="font-semibold">"{details?.prefill?.data_preprocessing?.request?.genesis?.model_mode || dpMode}"</span> mode
            </div>
          </div>
        </div>
      ) : isManual ? (
        <div className="space-y-2">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap items-center gap-2 px-4 pt-4">
              {manualTabs.map((tab, idx) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    width: '179.66665649414062px',
                    height: '38px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    paddingLeft: '34px',
                    paddingRight: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    ...(activeTab === idx
                      ? {
                          backgroundColor: '#f3f0ff',
                          borderBottom: '2px solid #8E77BB',
                          color: '#8E77BB',
                          fontWeight: '600'
                        }
                      : {
                          color: '#6b7280',
                          fontWeight: '500'
                        })
                  }}
                  className="transition-colors relative rounded-t hover:text-gray-700"
                >
                  {tab.label}
                </button>
              ))}
            </nav>
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