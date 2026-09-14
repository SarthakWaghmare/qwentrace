import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isReg) { await register(form.name, form.email, form.password); }
      else { await login(form.email, form.password); }
      navigate('/import');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'380px', background:'var(--elev1)', border:'1px solid var(--border)', borderRadius:'16px', padding:'36px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' }}>
          <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,var(--accent),#7c3aed)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', color:'#fff' }}>Q</div>
          <span style={{ fontSize:'14px', fontWeight:'700', color:'var(--text)' }}>QwenTrace.ai</span>
        </div>
        <h1 style={{ fontSize:'20px', fontWeight:'700', color:'var(--text)', marginBottom:'6px', letterSpacing:'-0.02em' }}>{isReg ? 'Create account' : 'Welcome back'}</h1>
        <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'24px' }}>{isReg ? 'Sign up to get started' : 'Sign in to your account'}</p>
        <form style={{ display:'flex', flexDirection:'column', gap:'16px' }} onSubmit={handleSubmit}>
          {isReg && (
            <div className="form-group">
              <label className="label" htmlFor="name">Name</label>
              <input className="input" id="name" name="name" type="text" placeholder="Jane Doe" value={form.name} onChange={handleChange} required autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required autoFocus={!isReg} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" value={form.password} onChange={handleChange} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:'10px', background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.4)', borderRadius:'8px', color:'var(--accent)', fontSize:'14px', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop:'4px' }}
          >
            {loading ? 'Please wait…' : isReg ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:'20px', fontSize:'13px', color:'var(--text2)' }}>
          {isReg ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={() => { setIsReg((p) => !p); setError(''); }}
            style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:'13px', fontWeight:'500', padding:'0 4px' }}
          >
            {isReg ? 'Sign in' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
