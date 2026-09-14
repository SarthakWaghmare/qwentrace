function StatusBadge({ status }) {
  const map = { indexed:['Indexed','badge-green'], parsing:['Parsing','badge-purple'], failed:['Failed','badge-red'] };
  const [label, cls] = map[status] || [status, 'badge-gray'];
  return <span className={'badge ' + cls}>{label}</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch { return d; }
}

const thS = { padding:'10px 16px', textAlign:'left', color:'var(--text3)', fontWeight:'500', fontSize:'11px', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' };
const tdS = { padding:'12px 16px', borderBottom:'1px solid var(--border)', color:'var(--text)', verticalAlign:'middle' };

export default function TransactionTable({ datasets }) {
  if (!datasets || datasets.length === 0) {
    return <div style={{ padding:'32px', textAlign:'center', color:'var(--text3)' }}>No datasets yet. Upload one above.</div>;
  }
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
        <thead>
          <tr>
            <th style={thS}>Filename</th>
            <th style={thS}>Rows</th>
            <th style={thS}>Status</th>
            <th style={thS}>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((ds) => (
            <tr key={ds._id || ds.id}
              onMouseEnter={(e) => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background='transparent'}
              style={{ transition:'background .1s' }}
            >
              <td style={tdS}>{ds.originalFilename || ds.name || 'Untitled'}</td>
              <td style={{ ...tdS, color:'var(--text2)' }}>{ds.rowCount != null ? ds.rowCount : '—'}</td>
              <td style={tdS}><StatusBadge status={ds.status} /></td>
              <td style={{ ...tdS, color:'var(--text2)' }}>{fmtDate(ds.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
