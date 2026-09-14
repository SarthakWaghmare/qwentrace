import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Import from './pages/Import';
import Ask from './pages/Ask';
import Evidence from './pages/Evidence';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:'13px' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:'13px' }}>Loading…</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/import" replace /> : <Login />} />
      <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
      <Route path="/ask" element={<ProtectedRoute><Ask /></ProtectedRoute>} />
      <Route path="/evidence/:queryId" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/import" replace />} />
      <Route path="*" element={<Navigate to="/import" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
