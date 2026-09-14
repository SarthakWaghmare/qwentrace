import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import EvidencePanel from '../components/EvidencePanel';
import client from '../api/client';

export default function Evidence() {
  const { queryId } = useParams();
  const [queryData, setQueryData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const qRes = await client.get('/queries/' + queryId);
        const data = qRes.data;
        setQueryData(data);
        const datasetId =
          data.datasetId ||
          data.dataset ||
          (data.query && (data.query.dataset || data.query.datasetId)) ||
          (data.evidence && (data.evidence.dataset || data.evidence.datasetId));
        if (datasetId) {
          try {
            const rRes = await client.get('/datasets/' + datasetId + '/rows?limit=100');
            setRows(Array.isArray(rRes.data) ? rRes.data : (rRes.data.rows || []));
          } catch (e) { /* rows may be unavailable */ }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to load evidence.');
      } finally { setLoading(false); }
    }
    load();
  }, [queryId]);

  const h1Style = { fontSize:'22px', fontWeight:'700', color:'var(--text)', letterSpacing:'-0.02em', marginBottom:'6px' };

  if (loading) return <Layout><h1 style={h1Style}>Evidence</h1><p style={{ color:'var(--text3)' }}>Loading…</p></Layout>;
  if (error) return <Layout><h1 style={h1Style}>Evidence</h1><p className="error-msg">{error}</p></Layout>;

  const evidence = (queryData && queryData.evidence) || {};
  const sourceRowNums = new Set(evidence.sourceRows || []);
  const columns = rows.length > 0
    ? Object.keys(rows[0]).filter((k) => k !== '_id' && k !== '__v' && k !== 'dataset' && k !== 'datasetId' && k !== 'rowNumber' && k !== 'rawData' && rows.some((r) => r[k] != null))
    : [];

  return (
    <Layout>
      <h1 style={h1Style}>Evidence</h1>
      <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'28px' }}>
        {(queryData && (queryData.question || (queryData.query && queryData.query.question))) || ('Query ' + queryId)}
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start' }}>
        <div style={{ background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', fontSize:'13px', fontWeight:'600', color:'var(--text)' }}>
            Source Transactions
            {rows.length > 0 && <span style={{ color:'var(--text3)', fontWeight:'400', marginLeft:'8px' }}>({rows.length} rows)</span>}
          </div>
          {rows.length === 0
            ? <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)' }}>No rows available</div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'8px 14px', textAlign:'left', color:'var(--text3)', fontWeight:'500', fontSize:'11px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>#</th>
                      {columns.map((col) => (
                        <th key={col} style={{ padding:'8px 14px', textAlign:'left', color:'var(--text3)', fontWeight:'500', fontSize:'11px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const rowNum = row.rowNumber != null ? row.rowNumber : idx + 1;
                      const hi = sourceRowNums.has(rowNum);
                      return (
                        <tr key={idx} style={{ background: hi ? 'rgba(167,139,250,0.12)' : 'transparent' }}>
                          <td style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', color: hi ? 'var(--accent)' : 'var(--text3)', fontWeight: hi ? '600' : '400', fontSize:'11px', whiteSpace:'nowrap' }}>{rowNum}</td>
                          {columns.map((col) => (
                            <td key={col} style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', color:'var(--text)', maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {row[col] != null ? (typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])) : '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        <div>
          <EvidencePanel evidence={evidence} />
        </div>
      </div>
    </Layout>
  );
}
