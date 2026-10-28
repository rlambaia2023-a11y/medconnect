import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '../lib/api';

export function MedicationsList() {
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState('');
  const { data } = useQuery({ queryKey: ['meds', q, letter], queryFn: async () => (await api.get('/content/medications', { params: { q, letter } })).data });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Medicamentos</h1>
      <div className="bg-white rounded-2xl border p-4 mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar medicamento..." className="w-full pl-9 pr-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-6">
        <button onClick={()=>setLetter('')} className={`px-2 py-1 text-sm rounded ${!letter?'bg-brand-600 text-white':'bg-slate-100'}`}>Todos</button>
        {letters.map(l => <button key={l} onClick={()=>setLetter(l)} className={`px-2 py-1 text-sm rounded ${letter===l?'bg-brand-600 text-white':'bg-slate-100'}`}>{l}</button>)}
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(data || []).map((m:any) => (
          <Link key={m.slug} to={`/medicamentos/${m.slug}`} className="bg-white rounded-xl border p-4 hover:shadow-md">
            <div className="font-medium text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-500 mt-1">{m.active_ingredient}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MedicationDetail() {
  const { slug } = useParams();
  const { data } = useQuery({ queryKey: ['med', slug], queryFn: async () => (await api.get(`/content/medications/${slug}`)).data });
  if (!data) return <div className="p-8 text-center">Carregando...</div>;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/medicamentos" className="text-brand-600 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-slate-900">{data.name}</h1>
      <p className="mt-2 text-slate-600">{data.active_ingredient}</p>
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-2xl border p-5"><h3 className="font-semibold mb-2">Descrição</h3><p className="text-slate-700">{data.description}</p></div>
        <div className="bg-white rounded-2xl border p-5"><h3 className="font-semibold mb-2">Uso</h3><p className="text-slate-700">{data.usage}</p></div>
        <div className="bg-white rounded-2xl border p-5"><h3 className="font-semibold mb-2">Efeitos colaterais</h3><p className="text-slate-700">{data.side_effects}</p></div>
      </div>
    </div>
  );
}