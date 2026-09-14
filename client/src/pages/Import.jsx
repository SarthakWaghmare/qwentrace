import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import FileDropzone from '../components/FileDropzone';
import TransactionTable from '../components/TransactionTable';
import client from '../api/client';

export default function Import() {
  const [datasets, setDatasets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  async function fetchDatasets() {
    try {
      const res = await client.get('/datasets');
      setDatasets(Array.isArray(res.data) ? res.data : (res.data.datasets || []));
    } catch (err) { console.error('fetch datasets', err); }
    finally { setLoadingList(false); }
  }

  useEffect(() => { fetchDatasets(); }, []);

  async function handleFile(file) {
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await client.post('/datasets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDatasets();
    } catch (err) {
      setUploadError(err?.response?.data?.message || err?.response?.data?.error || 'Upload failed.');
    } finally { setUploading(false); }
  }

  return (
    <Layout>
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'700', color:'var(--text)', letterSpacing:'-0.02em', marginBottom:'6px' }}>Import Data</h1>
        <p style={{ fontSize:'13px', color:'var(--text2)' }}>Upload a CSV, Excel, or JSON file to get started</p>
      </div>

      <FileDropzone onFile={handleFile} uploading={uploading} />
      {uploadError && <p className="error-msg" style={{ marginTop:'10px' }}>{uploadError}</p>}

      <div style={{ background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginTop:'20px' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', fontSize:'13px', fontWeight:'600', color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Your Datasets</span>
          <button
            onClick={fetchDatasets}
            disabled={loadingList}
            style={{ background:'none', border:'1px solid var(--border-strong)', borderRadius:'6px', color:'var(--text2)', fontSize:'12px', padding:'4px 10px', cursor:'pointer' }}
          >
            {loadingList ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
        {loadingList
          ? <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)' }}>Loading datasets…</div>
          : <TransactionTable datasets={datasets} />}
      </div>
    </Layout>
  );
}
