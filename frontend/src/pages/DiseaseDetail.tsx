import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function DiseaseDetail() {
  const { slug } = useParams();
  const { data } = useQuery({ queryKey: ['disease', slug], queryFn: async () => (await api.get(`/content/diseases/${slug}`)).data });
  if (!data) return <div className="p-8 text-center">Carregando...</div>;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/doencas" className="text-brand-600 text-sm mb-4 inline-block">← Voltar</Link>
      <h1 className="text-3xl font-bold text-slate-900">{data.name}</h1>
      <p className="mt-3 text-slate-700">{data.description}</p>
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Sintomas</h3>
          <p className="text-slate-700">{data.symptoms}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Tratamento</h3>
          <p className="text-slate-700">{data.treatment}</p>
        </div>
        {data.doctors?.length > 0 && (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Profissionais que tratam</h3>
            <div className="flex flex-wrap gap-2">
              {data.doctors.map((d:any) => <Link key={d.id} to={`/medico/${d.id}`} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm">{d.name}</Link>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}