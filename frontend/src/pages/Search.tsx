import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { api } from '../lib/api';
import DoctorCard from '../components/DoctorCard';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [specialty, setSpecialty] = useState(params.get('specialty') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [insurance, setInsurance] = useState(params.get('insurance') || '');
  const [modality, setModality] = useState(params.get('modality') || '');
  const [sort, setSort] = useState(params.get('sort') || 'rating');
  const [page, setPage] = useState(Number(params.get('page') || 1));

  const { data: specs } = useQuery({ queryKey: ['specs'], queryFn: async () => (await api.get('/doctors/specialties')).data });
  const { data: insurances } = useQuery({ queryKey: ['ins'], queryFn: async () => (await api.get('/doctors/meta/insurances')).data });
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: async () => (await api.get('/doctors/meta/cities')).data });

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, specialty, city, insurance, modality, sort, page],
    queryFn: async () => (await api.get('/doctors', { params: { q, specialty, city, insurance, modality, sort, page, limit: 12 } })).data,
  });

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (specialty) p.set('specialty', specialty);
    if (city) p.set('city', city);
    if (insurance) p.set('insurance', insurance);
    if (modality) p.set('modality', modality);
    if (sort) p.set('sort', sort);
    p.set('page', '1');
    setParams(p);
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <form onSubmit={apply} className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Nome ou especialidade" className="w-full pl-9 pr-3 py-2 border rounded-lg" />
          </div>
          <select value={specialty} onChange={(e)=>setSpecialty(e.target.value)} className="py-2 px-3 border rounded-lg">
            <option value="">Todas especialidades</option>
            {specs?.map((s:any)=> <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
          <select value={city} onChange={(e)=>setCity(e.target.value)} className="py-2 px-3 border rounded-lg">
            <option value="">Todas cidades</option>
            {cities?.map((c:string)=> <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={insurance} onChange={(e)=>setInsurance(e.target.value)} className="py-2 px-3 border rounded-lg">
            <option value="">Todos convênios</option>
            {insurances?.map((i:string)=> <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={modality} onChange={(e)=>setModality(e.target.value)} className="py-2 px-3 border rounded-lg">
            <option value="">Presencial ou online</option>
            <option value="online">Teleconsulta</option>
          </select>
        </form>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <select value={sort} onChange={(e)=>{setSort(e.target.value); apply();}} className="py-2 px-3 border rounded-lg text-sm">
              <option value="rating">Melhor avaliados</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>
          <button onClick={apply} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Aplicar filtros</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">
          {isLoading ? 'Buscando...' : `${data?.total || 0} profissionais encontrados`}
        </h1>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i)=> <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.doctors || []).map((d:any) => <DoctorCard key={d.id} d={d} />)}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({length: Math.ceil(data.total/data.limit)}).slice(0,10).map((_,i)=>(
            <button key={i} onClick={()=>{setPage(i+1);}} className={`px-3 py-1.5 rounded-lg text-sm ${page===i+1?'bg-brand-600 text-white':'bg-white border'}`}>{i+1}</button>
          ))}
        </div>
      )}
    </div>
  );
}