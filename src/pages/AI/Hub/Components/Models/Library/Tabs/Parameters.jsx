import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../../../../../context/AuthContext'

function Parameters({ modelData }) {
  const { token } = useAuth()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const runName = modelData?.run_name

  useEffect(() => {
    if (!runName) return
    setLoading(true)
    setError('')
    fetch(`${window._env_?.VITE_AI_API}/canvas/model/${runName}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
      .then(setDetails)
      .catch(err => setError(typeof err === 'string' ? err : 'Error loading parameters'))
      .finally(() => setLoading(false))
  }, [runName, token])

  if (loading) return <div className="py-8 text-center text-gray-500">Loading parameters...</div>
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>
  if (!details) return <div className="py-8 text-center text-gray-400">No parameter data found.</div>

  const Card = ({ title, value }) => (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex-1 min-w-[180px]">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="text-base font-semibold text-black break-all">{value}</div>
    </div>
  )

  const genesisConfig = details.prefill?.data_preprocessing?.request?.genesis || {}
  const genesisKeys = Object.keys(genesisConfig)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Model Name" value={details.model_name} />
        <Card title="Project" value={details.project_name} />
        <Card title="Dataset" value={details.dataset_name} />
        <Card title="Workflow ID" value={details.workflow_id} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Model ID" value={details.model_id} />
        <Card title="Project ID" value={details.project_id} />
        <Card title="Dataset ID" value={details.dataset_id} />
        <Card title="Storage Path" value={details.storage_path} />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="font-semibold text-gray-700 mb-2">Available Files</div>
        <div className="flex flex-wrap gap-2">
          {(details.available_files || []).map(f => (
            <span key={f} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{f}</span>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="font-semibold text-gray-700 mb-2">Prefill Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {genesisKeys.length === 0 ? (
            <div className="text-xs text-gray-400 col-span-4">No prefill summary available.</div>
          ) : (
            genesisKeys.map(key => (
              <Card key={key} title={key} value={String(genesisConfig[key])} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Parameters