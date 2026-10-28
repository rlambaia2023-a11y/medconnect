import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../lib/api';
import { useAuth } from '../store/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.user);
      setUser(data.user);
      navigate(data.user.role === 'doctor' ? '/profissional' : '/paciente');
    } catch (e: any) {
      setErr(e.response?.data?.erro || 'Erro ao entrar');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Entrar</h1>
        <p className="text-slate-600 mb-6">Acesse sua conta MedConnect.</p>
        {err && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="E-mail" className="w-full border rounded-lg py-2.5 px-3" required />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Senha" className="w-full border rounded-lg py-2.5 px-3" required />
          <button disabled={loading} className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-semibold disabled:bg-slate-300">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Não tem conta? <Link to="/cadastro" className="text-brand-600 font-medium">Criar conta</Link>
        </p>
        <div className="mt-4 text-xs text-slate-400 text-center">
          Demo: paciente@medconnect.com / demo123 • admin@medconnect.com / demo123
        </div>
      </div>
    </div>
  );
}