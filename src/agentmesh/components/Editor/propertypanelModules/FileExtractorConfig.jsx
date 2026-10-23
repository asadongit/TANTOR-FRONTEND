import React, { useState } from 'react';
import { Select, Field, Input, Toggle } from './SharedComponents';
import { uploadTempFile } from '../../../api/agentmesh';
import { FiUpload, FiLoader, FiCheck } from 'react-icons/fi';

export default function FileExtractorConfig({ data, update }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('file', file);
      // Hardcode a default thread_id for now if missing, as required by the backend
      formData.append('thread_id', 'editor_upload');

      const uploadRes = await uploadTempFile(formData);
      
      if (uploadRes?.vfs_path) {
        update({ extract_file_path: uploadRes.vfs_path });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to upload file: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Field label="Upload File" hint="Choose a file from your computer to extract data from.">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            background: isUploading ? '#CBD5E1' : '#0369A1', color: 'white',
            borderRadius: 8, cursor: isUploading ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, transition: 'background 0.2s'
          }}>
            {isUploading ? <FiLoader className="spin" /> : uploadSuccess ? <FiCheck /> : <FiUpload />}
            {isUploading ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Select File'}
            <input 
              type="file" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </label>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {data.extract_file_path || 'No file selected'}
          </div>
        </div>
      </Field>

      <Field label="Extract Format" hint="Choose the format to extract the file as.">
        <Select
          value={data.extract_format || 'text'}
          onChange={(v) => update({ extract_format: v })}
          options={[
            { value: 'text', label: 'Plain Text' },
            { value: 'json', label: 'JSON' },
            { value: 'base64', label: 'Base64 Encoded' }
          ]}
        />
      </Field>

      <Field label="Output Key" hint="The context variable name where the data should be saved. Defaults to 'extracted_file_content'.">
        <Input
          value={data.extract_output_key || ''}
          onChange={(v) => update({ extract_output_key: v })}
          placeholder="e.g. extracted_file_content"
        />
      </Field>

      <div style={{ padding: 16, background: '#F8F9FA', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
        <Toggle
          checked={data.extract_skip_errors || false}
          onChange={(v) => update({ extract_skip_errors: v })}
          label="Skip on Error"
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginLeft: 50 }}>
          If enabled, the workflow will continue execution even if the file is not found or fails to read.
        </div>
      </div>
    </>
  );
}
