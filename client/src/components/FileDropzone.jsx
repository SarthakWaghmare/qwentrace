import { useState, useRef } from 'react';

export default function FileDropzone({ onFile, uploading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const style = {
    border: dragging ? '2px dashed var(--accent)' : '2px dashed var(--border-strong)',
    background: dragging ? 'rgba(167,139,250,0.05)' : 'var(--elev1)',
    borderRadius: '12px', padding: '40px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '12px', cursor: 'pointer',
    transition: 'all .15s', textAlign: 'center',
  };

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      style={style}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current && inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.json" style={{ display:'none' }} onChange={handleChange} />
      <div style={{ fontSize:'32px' }}>&#128193;</div>
      {uploading ? (
        <p style={{ color:'var(--text2)' }}>Uploading&hellip;</p>
      ) : (
        <>
          <p style={{ color:'var(--text)', fontWeight:'500' }}>Drop a file here, or click to browse</p>
          <p style={{ color:'var(--text3)', fontSize:'12px' }}>Supports CSV, XLSX, JSON</p>
        </>
      )}
    </div>
  );
}
