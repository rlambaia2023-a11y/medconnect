import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api, setAuth } from '../lib/api';
import { useAuth } from '../store/auth';

export default function Register() {
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(params.get('role') === 'doctor' ? 'doctor' : 'patient');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role, city, state });
      setAuth(data.token, data.user);
      setUser(data.user);
      navigate(role === 'doctor' ? '/profissional' : '/paciente');
    } catch (e: any) {
      setErr(e.response?.data?.erro || 'Erro ao cadastrar');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Criar conta</h1>
        <p className="text-slate-600 mb-6">Junte-se à MedConnect.</p>
        {err && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={()=>setRole('patient')} className={`flex-1 py-2 rounded-lg border text-sm ${role==='patient'?'bg-brand-600 text-white border-brand-600':'bg-white'}`}>Paciente</button>
            <button type="button" onClick={()=>setRole('doctor')} className={`flex-1 py-2 rounded-lg border text-sm ${role==='doctor'?'bg-brand-600 text-white border-brand-600':'bg-white'}`}>Profissional</button>
          </div>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nome completo" className="w-full border rounded-lg py-2.5 px-3" required />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="E-mail" className="w-full border rounded-lg py-2.5 px-3" required />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Senha" className="w-full border rounded-lg py-2.5 px-3" required />
          <div className="grid grid-cols-2 gap-2">
            <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Cidade" className="border rounded-lg py-2.5 px-3" />
            <input value={state} onChange={(e)=>setState(e.target.value)} placeholder="UF" className="border rounded-lg py-2.5 px-3" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-semibold disabled:bg-slate-300">
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Já tem conta? <Link to="/login" className="text-brand-600 font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}