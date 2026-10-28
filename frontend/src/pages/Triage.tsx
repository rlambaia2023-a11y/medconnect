import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Triage() {
  const [text, setText] = useState('');
  const mut = useMutation({ mutationFn: async () => (await api.post('/content/triage', { text })).data });
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Triagem inteligente</h1>
      <p className="text-slate-600 mb-6">Descreva seus sintomas e receba uma sugestão de especialidade.</p>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={4} className="w-full border rounded-lg p-3 mb-3" placeholder="Ex: dor no peito e palpitações..." />
      <button onClick={()=>mut.mutate()} disabled={!text || mut.isPending} className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium disabled:bg-slate-300">
        {mut.isPending ? 'Analisando...' : 'Analisar sintomas'}
      </button>
      {mut.data && (
        <div className="mt-6 bg-white rounded-2xl border p-5">
          <p className="text-slate-700">{mut.data.message}</p>
          <Link to={`/busca?specialty=${mut.data.specialty}`} className="mt-3 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Buscar {mut.data.specialty}</Link>
        </div>
      )}
    </div>
  );
}