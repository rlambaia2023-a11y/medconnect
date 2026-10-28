import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function BlogList() {
  const { data } = useQuery({ queryKey: ['articles'], queryFn: async () => (await api.get('/content/articles')).data });
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Blog para pacientes</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {(data || []).map((a:any) => (
          <Link key={a.slug} to={`/blog/${a.slug}`} className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition">
            <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-300" />
            <div className="p-4">
              <span className="text-xs text-brand-600 font-medium">{a.specialty}</span>
              <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2">{a.title}</h3>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{a.excerpt}</p>
              <div className="mt-2 text-xs text-slate-400">{a.author}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const { data } = useQuery({ queryKey: ['article', slug], queryFn: async () => (await api.get(`/content/articles/${slug}`)).data });
  if (!data) return <div className="p-8 text-center">Carregando...</div>;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/blog" className="text-brand-600 text-sm mb-4 inline-block">← Voltar</Link>
      <span className="text-xs text-brand-600 font-medium">{data.specialty}</span>
      <h1 className="text-3xl font-bold text-slate-900 mt-1">{data.title}</h1>
      <div className="text-sm text-slate-500 mt-2">Por {data.author}</div>
      <div className="mt-6 prose text-slate-700 whitespace-pre-line">{data.content}</div>
    </div>
  );
}