function Panel({ title, children }) {
  return (
    <div style={{ background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'10px', marginBottom:'12px', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:'11px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  );
}

export default function EvidencePanel({ evidence }) {
  if (!evidence) return <div style={{ color:'var(--text3)', fontSize:'13px' }}>No evidence data.</div>;
  const { conclusion, computations, sourceRows } = evidence;
  return (
    <div>
      <Panel title="Conclusion">
        <p style={{ color:'var(--text)', lineHeight:'1.6', fontSize:'13px' }}>{conclusion || '—'}</p>
      </Panel>
      <Panel title="Computations">
        {computations && computations.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {computations.map((c, i) => (
              <div key={i} style={{ padding:'10px 12px', background:'var(--elev2)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'4px' }}>{c.label}</div>
                <div style={{ fontFamily:'monospace', fontSize:'12px', color:'var(--accent)', marginBottom:'4px' }}>{c.formula}</div>
                <div style={{ fontSize:'14px', fontWeight:'600', color:'var(--text)' }}>{c.value}</div>
              </div>
            ))}
          </div>
        ) : <span style={{ color:'var(--text3)', fontSize:'12px' }}>No computations</span>}
      </Panel>
      <Panel title="Source Rows">
        {sourceRows && sourceRows.length > 0 ? (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {sourceRows.map((row, i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'100px', fontSize:'12px', fontWeight:'600', background: i===0 ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)', color: i===0 ? 'var(--accent)' : 'var(--text2)', border: i===0 ? '1px solid rgba(167,139,250,0.4)' : '1px solid var(--border)' }}>Row {row}</span>
            ))}
          </div>
        ) : <span style={{ color:'var(--text3)', fontSize:'12px' }}>No source rows</span>}
      </Panel>
    </div>
  );
}
