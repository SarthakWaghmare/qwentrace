import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qt_token');
    if (token) {
      client
        .get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('qt_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('qt_token', token);
    setUser(userData);
    return userData;
  }

  async function register(name, email, password) {
    const res = await client.post('/auth/register', { name, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('qt_token', token);
    setUser(userData);
    return userData;
  }

  function logout() {
    localStorage.removeItem('qt_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
