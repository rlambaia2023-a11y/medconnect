import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';

export default function DiseasesList() {
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState('');
  const { data } = useQuery({
    queryKey: ['diseases', q, letter],
    queryFn: async () => (await api.get('/content/diseases', { params: { q, letter } })).data,
  });

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Doenças</h1>
      <div className="bg-white rounded-2xl border p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar doença..." className="w-full pl-9 pr-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-6">
        <button onClick={()=>setLetter('')} className={`px-2 py-1 text-sm rounded ${!letter?'bg-brand-600 text-white':'bg-slate-100'}`}>Todos</button>
        {letters.map(l => (
          <button key={l} onClick={()=>setLetter(l)} className={`px-2 py-1 text-sm rounded ${letter===l?'bg-brand-600 text-white':'bg-slate-100'}`}>{l}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(data || []).map((d:any) => (
          <Link key={d.slug} to={`/doencas/${d.slug}`} className="bg-white rounded-xl border p-4 hover:shadow-md">
            <div className="font-medium text-slate-900">{d.name}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}