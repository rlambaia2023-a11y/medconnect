import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { formatDateTime } from '../lib/utils';

export default function PatientDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: appointments } = useQuery({ queryKey: ['my-appts'], queryFn: async () => (await api.get('/appointments/mine')).data });
  const { data: favs } = useQuery({ queryKey: ['favs'], queryFn: async () => (await api.get('/messages/favorites')).data });
  const { data: inbox } = useQuery({ queryKey: ['inbox'], queryFn: async () => (await api.get('/messages/inbox')).data });

  const cancel = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/appointments/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appts'] }),
  });

  const upcoming = (appointments || []).filter((a:any) => new Date(a.start) >= new Date() && a.status !== 'cancelled');
  const past = (appointments || []).filter((a:any) => new Date(a.start) < new Date() || a.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-600">Gerencie suas consultas e favoritos.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-5">
          <div className="text-sm text-slate-500">Próximas consultas</div>
          <div className="text-3xl font-bold text-brand-600">{upcoming.length}</div>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="text-sm text-slate-500">Consultas realizadas</div>
          <div className="text-3xl font-bold text-emerald-600">{past.length}</div>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="text-sm text-slate-500">Mensagens não lidas</div>
          <div className="text-3xl font-bold text-amber-600">{(inbox || []).filter((m:any)=>!m.read).length}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-3">Próximas consultas</h2>
      <div className="space-y-3 mb-8">
        {upcoming.length === 0 && <p className="text-slate-500">Nenhuma consulta agendada. <Link to="/busca" className="text-brand-600">Buscar profissionais</Link></p>}
        {upcoming.map((a:any) => (
          <div key={a.id} className="bg-white rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{a.doctor_name}</div>
              <div className="text-sm text-slate-600">{a.service_name} • {a.modality === 'online' ? 'Online' : a.city}</div>
              <div className="text-sm text-brand-600 font-medium mt-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDateTime(a.start)}</div>
              {a.meeting_url && <a href={a.meeting_url} target="_blank" rel="noreferrer" className="text-sm text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">🎥 Entrar na teleconsulta</a>}
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{a.paid ? 'Pago' : 'Pendente'}</span>
              <button onClick={()=>cancel.mutate(a.id)} className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Cancelar</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-3">Favoritos</h2>
      <div className="grid md:grid-cols-3 gap-3 mb-8">
        {(favs || []).map((f:any) => (
          <Link key={f.id} to={`/medico/${f.id}`} className="bg-white rounded-xl border p-4 hover:shadow-md">
            <div className="font-medium">{f.name}</div>
            <div className="text-sm text-slate-500">Ver perfil →</div>
          </Link>
        ))}
        {(!favs || favs.length === 0) && <p className="text-slate-500">Nenhum favorito ainda.</p>}
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-3">Mensagens recentes</h2>
      <div className="space-y-2">
        {(inbox || []).slice(0,5).map((m:any) => (
          <div key={m.id} className={`bg-white rounded-xl border p-3 ${!m.read ? 'border-brand-300' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{m.from_name}</span>
              <span className="text-xs text-slate-400">{formatDateTime(m.created_at)}</span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-1">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}