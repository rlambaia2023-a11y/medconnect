import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDateTime, formatCurrency } from '../lib/utils';
import { Calendar, DollarSign, Star, Plus, Save, CheckCircle2 } from 'lucide-react';

export default function ProfessionalDashboard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['prof-me'], queryFn: async () => (await api.get('/admin/professional/me')).data });
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<string[]>([]);

  useEffect(() => {}, []);

  const save = useMutation({
    mutationFn: async () => (await api.put('/admin/professional/me', { bio, services, insurances, accepts_online: data?.doctor?.accepts_online })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prof-me'] }); setEditing(false); },
  });

  // sync when data loads
  if (data && !editing && services.length === 0 && data.services) {
    setBio(data.doctor?.bio || '');
    setServices(data.services || []);
    setInsurances(data.insurances || []);
  }

  if (!data) return <div className="p-8 text-center">Carregando...</div>;

  const { doctor, appointments, stats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel profissional</h1>
          <p className="text-slate-600">{doctor.name} • {doctor.specialties?.map((s:any)=>s.name).join(', ')}</p>
        </div>
        <button onClick={()=>setEditing(!editing)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
          {editing ? 'Cancelar' : 'Editar perfil'}
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> Total consultas</div><div className="text-3xl font-bold">{stats.totalAppointments}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Concluídas</div><div className="text-3xl font-bold text-emerald-600">{stats.completed}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Receita</div><div className="text-2xl font-bold text-brand-600">{formatCurrency(stats.revenue)}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><Star className="w-4 h-4" /> Avaliação</div><div className="text-3xl font-bold text-amber-500">{stats.avgRating}</div></div>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border p-6 mb-8">
          <h2 className="font-bold text-slate-900 mb-4">Editar perfil</h2>
          <label className="block text-sm font-medium mb-1">Biografia</label>
          <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={4} className="w-full border rounded-lg p-2 mb-4" />
          <h3 className="font-semibold mb-2">Serviços</h3>
          {services.map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <input value={s.name} onChange={(e)=>{const c=[...services]; c[i].name=e.target.value; setServices(c);}} className="border rounded p-2 col-span-2" placeholder="Nome" />
              <input type="number" value={s.price} onChange={(e)=>{const c=[...services]; c[i].price=Number(e.target.value); setServices(c);}} className="border rounded p-2" placeholder="Preço" />
              <input type="number" value={s.duration_min} onChange={(e)=>{const c=[...services]; c[i].duration_min=Number(e.target.value); setServices(c);}} className="border rounded p-2" placeholder="Min" />
            </div>
          ))}
          <button onClick={()=>setServices([...services, { name: '', price: 0, duration_min: 30 }])} className="text-sm text-brand-600 flex items-center gap-1 mb-4"><Plus className="w-4 h-4" /> Adicionar serviço</button>
          <h3 className="font-semibold mb-2">Convênios</h3>
          <input value={insurances.join(', ')} onChange={(e)=>setInsurances(e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} className="w-full border rounded p-2 mb-4" placeholder="Separe por vírgula" />
          <button onClick={()=>save.mutate()} disabled={save.isPending} className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-900 mb-3">Agenda de consultas</h2>
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Paciente</th>
              <th className="text-left p-3">Serviço</th>
              <th className="text-left p-3">Data/Hora</th>
              <th className="text-left p-3">Modalidade</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(appointments || []).map((a:any) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.patient_name}</td>
                <td className="p-3">{a.service_name}</td>
                <td className="p-3">{formatDateTime(a.start)}</td>
                <td className="p-3">{a.modality}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${a.status==='completed'?'bg-emerald-100 text-emerald-700':a.status==='cancelled'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                </td>
                <td className="p-3">{formatCurrency(a.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(appointments || []).length === 0 && <p className="p-4 text-slate-500">Nenhuma consulta ainda.</p>}
      </div>

      <h2 className="text-lg font-bold text-slate-900 mt-8 mb-3">Opiniões recentes</h2>
      <div className="space-y-3">
        {(data.reviews || []).map((r:any) => (
          <div key={r.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <div className="font-medium text-sm">{r.patient_name}</div>
              <div className="flex">{Array.from({length:5}).map((_,i)=> <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
              <span className="ml-auto text-xs text-slate-400">{formatDateTime(r.created_at)}</span>
            </div>
            <p className="text-sm text-slate-700 mt-1">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}