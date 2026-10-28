import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { DollarSign, Users, Stethoscope, Star } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get('/admin/stats')).data });
  if (!data) return <div className="p-8 text-center">Carregando...</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Painel administrativo</h1>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><Users className="w-4 h-4" /> Usuários</div><div className="text-3xl font-bold">{data.users}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><Stethoscope className="w-4 h-4" /> Médicos</div><div className="text-3xl font-bold">{data.doctors}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><Star className="w-4 h-4" /> Avaliações</div><div className="text-3xl font-bold">{data.reviews}</div></div>
        <div className="bg-white rounded-2xl border p-5"><div className="text-sm text-slate-500 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Receita</div><div className="text-2xl font-bold text-brand-600">{formatCurrency(data.revenue)}</div></div>
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-bold text-slate-900 mb-3">Consultas por status</h2>
        <div className="space-y-2">
          {(data.byStatus || []).map((s:any) => (
            <div key={s.status} className="flex items-center justify-between">
              <span className="capitalize">{s.status}</span>
              <span className="font-bold">{s.c}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border p-6 mt-6">
        <h2 className="font-bold text-slate-900 mb-3">Top médicos</h2>
        {(data.topDoctors || []).map((d:any) => (
          <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <span>{d.name}</span>
            <span className="text-sm text-slate-500">⭐ {d.rating} ({d.review_count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}