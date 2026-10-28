import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, Stethoscope } from 'lucide-react';
import { useAuth } from '../store/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('mc_dark') === '1');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mc_dark', dark ? '1' : '0');
  }, [dark]);
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/busca?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600 shrink-0">
          <Stethoscope className="w-7 h-7" />
          <span>MedConnect</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Especialidade, médico ou doença..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-2 ml-auto">
          <Link to="/doencas" className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600">Doenças</Link>
          <Link to="/medicamentos" className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600">Medicamentos</Link>
          <Link to="/pergunte" className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600">Pergunte</Link>
          <Link to="/triagem" className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600">Triagem</Link>
          <button onClick={()=>setDark(!dark)} className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600">{dark ? '☀️' : '🌙'}</button>
          {user ? (
            <>
              <Link to={user.role === 'doctor' ? '/profissional' : '/paciente'} className="px-3 py-2 text-sm text-slate-600 hover:text-brand-600 flex items-center gap-1">
                <User className="w-4 h-4" /> {user.name.split(' ')[0]}
              </Link>
              <button onClick={logout} className="px-3 py-2 text-sm text-slate-600 hover:text-red-600 flex items-center gap-1">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-600">Entrar</Link>
              <Link to="/cadastro" className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-full hover:bg-brand-700">Criar conta</Link>
            </>
          )}
        </nav>

        <button className="md:hidden ml-auto" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <form onSubmit={handleSearch} className="flex">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar..." className="flex-1 px-3 py-2 border rounded-l-full" />
            <button className="px-4 bg-brand-600 text-white rounded-r-full"><Search className="w-4 h-4" /></button>
          </form>
          <Link to="/doencas" className="block py-2" onClick={()=>setOpen(false)}>Doenças</Link>
          <Link to="/medicamentos" className="block py-2" onClick={()=>setOpen(false)}>Medicamentos</Link>
          <Link to="/pergunte" className="block py-2" onClick={()=>setOpen(false)}>Pergunte ao especialista</Link>
          {user ? (
            <>
              <Link to={user.role === 'doctor' ? '/profissional' : '/paciente'} className="block py-2" onClick={()=>setOpen(false)}>Meu painel</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="block py-2 text-red-600">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2" onClick={()=>setOpen(false)}>Entrar</Link>
              <Link to="/cadastro" className="block py-2" onClick={()=>setOpen(false)}>Criar conta</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}