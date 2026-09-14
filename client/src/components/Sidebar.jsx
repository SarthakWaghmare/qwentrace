import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--elev1)', borderRight:'1px solid var(--border)', overflow:'hidden' }}>
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
        <div style={{ width:'28px', height:'28px', background:'linear-gradient(135deg,var(--accent),#7c3aed)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff', flexShrink:0 }}>Q</div>
        <span style={{ fontSize:'14px', fontWeight:'700', color:'var(--text)', letterSpacing:'-0.02em' }}>QwenTrace.ai</span>
      </div>

      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'2px' }}>
        {[
          { to:'/import', icon:'⬆', label:'Import Data' },
          { to:'/ask',    icon:'💬', label:'Ask a Question' },
        ].map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'10px',
              padding:'8px 12px', borderRadius:'8px',
              fontSize:'13px', fontWeight:'500',
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'rgba(167,139,250,0.1)' : 'transparent',
              textDecoration:'none', transition:'all .12s',
            })}
          >
            <span style={{ width:'18px', textAlign:'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding:'16px', borderTop:'1px solid var(--border)' }}>
        {user && (
          <>
            <div style={{ marginBottom:'10px' }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name || 'User'}</div>
              <div style={{ fontSize:'11px', color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
            </div>
            <button
              onClick={logout}
              style={{ width:'100%', padding:'7px 12px', background:'transparent', border:'1px solid var(--border-strong)', borderRadius:'7px', color:'var(--text2)', fontSize:'12px', fontWeight:'500', cursor:'pointer', textAlign:'left' }}
              onMouseEnter={(e) => { e.target.style.color='var(--danger)'; e.target.style.borderColor='rgba(248,113,113,0.3)'; }}
              onMouseLeave={(e) => { e.target.style.color='var(--text2)'; e.target.style.borderColor='var(--border-strong)'; }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
