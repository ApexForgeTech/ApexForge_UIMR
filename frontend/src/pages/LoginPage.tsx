import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';
import api from '../api/axios';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;
      login({ id: data.userId, username: data.username, role: data.role }, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center animate-fade-in" style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, var(--bg-surface) 0%, var(--bg-base) 100%)' }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--primary)',
          filter: 'blur(80px)',
          opacity: 0.5,
          borderRadius: '50%'
        }} />

        <div className="flex flex-col items-center mb-8" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--info))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <ShieldAlert size={32} color="white" />
          </div>
          <h2 className="h2" style={{ marginBottom: '0.25rem' }}>Welcome Back</h2>
          <p className="text-secondary text-sm">Unified Incident Management & Response</p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'var(--critical-bg)',
            color: 'var(--critical)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label flex justify-between">
              Password
              <a href="#" className="text-xs">Forgot password?</a>
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="hover-lift"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '1rem',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all var(--transition-fast)'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
