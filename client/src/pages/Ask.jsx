import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import client from '../api/client';

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--danger)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ flex:1, height:'6px', background:'var(--elev2)', borderRadius:'3px', overflow:'hidden' }}>
        <div style={{ width: pct + '%', height:'100%', background:color, borderRadius:'3px', transition:'width .4s ease' }} />
      </div>
      <span style={{ color, fontWeight:'600', fontSize:'13px', minWidth:'38px' }}>{pct}%</span>
    </div>
  );
}

function ToolCallCard({ tool }) {
  const [open, setOpen] = useState(false);
  const name = tool.toolName || tool.name;
  return (
    <div style={{ background:'var(--elev2)', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ width:'100%', padding:'10px 14px', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', color:'var(--text)', fontSize:'13px' }}
      >
        <span style={{ fontFamily:'monospace', color:'var(--accent)', fontWeight:'600' }}>{name}</span>
        <span style={{ color:'var(--text3)', fontSize:'12px' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <pre style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', margin:0, fontSize:'12px', color:'var(--text2)', overflowX:'auto', fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
          {typeof tool.arguments === 'string' ? tool.arguments : JSON.stringify(tool.arguments, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Ask() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/datasets').then((res) => {
      const all = Array.isArray(res.data) ? res.data : (res.data.datasets || []);
      const indexed = all.filter((d) => d.status === 'indexed');
      setDatasets(indexed);
      if (indexed.length > 0) setDatasetId(indexed[0]._id || indexed[0].id);
    }).catch(console.error);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!datasetId || !question.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await client.post('/queries', { datasetId, question });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Query failed.');
    } finally { setLoading(false); }
  }

  const disabled = loading || !datasetId || !question.trim();

  return (
    <Layout>
      <h1 style={{ fontSize:'22px', fontWeight:'700', color:'var(--text)', letterSpacing:'-0.02em', marginBottom:'6px' }}>Ask a Question</h1>
      <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'28px' }}>Query your indexed datasets using natural language</p>

      <div style={{ background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px', marginBottom:'24px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom:'16px' }}>
            <label className="label" htmlFor="dataset">Dataset</label>
            {datasets.length === 0
              ? <p style={{ color:'var(--text3)', fontSize:'13px' }}>No indexed datasets. Import and index one first.</p>
              : (
                <select id="dataset" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', background:'var(--elev2)', border:'1px solid var(--border-strong)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', cursor:'pointer' }}
                >
                  {datasets.map((ds) => (
                    <option key={ds._id || ds.id} value={ds._id || ds.id} style={{ background:'var(--elev2)' }}>
                      {ds.name || ds.originalFilename || ds.filename || ds.originalName || ds._id || ds.id}
                    </option>
                  ))}
                </select>
              )
            }
          </div>
          <div className="form-group" style={{ marginBottom:'16px' }}>
            <label className="label" htmlFor="question">Question</label>
            <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What was the total revenue in Q3?"
              style={{ width:'100%', padding:'10px 12px', background:'var(--elev1)', border:'1px solid var(--border-strong)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', resize:'vertical', minHeight:'100px', lineHeight:'1.5', fontFamily:'inherit' }}
            />
          </div>
          {error && <p className="error-msg" style={{ marginBottom:'12px' }}>{error}</p>}
          <button type="submit" disabled={disabled}
            style={{ padding:'9px 24px', background: disabled ? 'rgba(167,139,250,0.05)' : 'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.4)', borderRadius:'8px', color:'var(--accent)', fontSize:'13px', fontWeight:'600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
          >
            {loading ? 'Thinking…' : 'Ask →'}
          </button>
        </form>
      </div>

      {result && (
        <div style={{ background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)' }}>Answer</span>
            {(result.queryId || result._id || result.id) && (
              <button onClick={() => navigate('/evidence/' + (result.queryId || result._id || result.id))}
                style={{ padding:'6px 14px', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:'7px', color:'var(--accent)', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}
              >View evidence →</button>
            )}
          </div>
          <div style={{ padding:'20px' }}>
            <p style={{ color:'var(--text)', lineHeight:'1.7', marginBottom:'20px', fontSize:'14px' }}>{result.answer}</p>
            <div style={{ display:'flex', gap:'32px', marginBottom:'24px', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:'160px' }}>
                <div className="label" style={{ marginBottom:'8px' }}>Confidence</div>
                <ConfidenceBar value={result.confidence} />
              </div>
              {(result.latencyMs != null || result.latency != null) && (
                <div>
                  <div className="label" style={{ marginBottom:'8px' }}>Latency</div>
                  <span style={{ color:'var(--text2)', fontWeight:'600' }}>{result.latencyMs ?? result.latency} ms</span>
                </div>
              )}
            </div>
            {result.toolCalls && result.toolCalls.length > 0 && (
              <div>
                <div className="label" style={{ marginBottom:'10px' }}>Tool Calls ({result.toolCalls.length})</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {result.toolCalls.map((tool, i) => <ToolCallCard key={i} tool={tool} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
