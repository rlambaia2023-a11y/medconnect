import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, Bell, Star, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import DoctorCard from '../components/DoctorCard';

const popularSpecs = [
  { slug: 'cardiologista', name: 'Cardiologista', icon: '❤️' },
  { slug: 'psiquiatra', name: 'Psiquiatra', icon: '🧠' },
  { slug: 'psicologo', name: 'Psicólogo', icon: '💬' },
  { slug: 'dermatologista', name: 'Dermatologista', icon: '✨' },
  { slug: 'ginecologista', name: 'Ginecologista', icon: '🌸' },
  { slug: 'ortopedista-traumatologista', name: 'Ortopedista', icon: '🦴' },
  { slug: 'endocrinologista', name: 'Endocrinologista', icon: '⚗️' },
  { slug: 'nutricionista', name: 'Nutricionista', icon: '🥗' },
  { slug: 'pediatra', name: 'Pediatra', icon: '👶' },
  { slug: 'clinico-geral', name: 'Clínico Geral', icon: '🩺' },
  { slug: 'dentista', name: 'Dentista', icon: '🦷' },
  { slug: 'oftalmologista', name: 'Oftalmologista', icon: '👁️' },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['doctors', 'home'],
    queryFn: async () => (await api.get('/doctors', { params: { limit: 8, sort: 'rating' } })).data,
  });
  const { data: articles } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => (await api.get('/content/articles')).data,
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/busca${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Encontre o profissional de saúde ideal e agende em minutos
            </h1>
            <p className="mt-4 text-lg text-brand-100">
              Mais de 1 milhão de especialistas prontos para te ajudar. Busca inteligente, agendamento online 24h, lembretes automáticos e teleconsulta.
            </p>
            <form onSubmit={search} className="mt-8 bg-white rounded-full p-2 flex gap-2 max-w-2xl shadow-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Especialidade, doença ou nome do médico"
                  className="w-full pl-12 pr-4 py-3 rounded-full text-slate-900 focus:outline-none"
                />
              </div>
              <button className="px-6 py-3 bg-brand-600 hover:bg-brand-700 rounded-full font-semibold">Buscar</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {popularSpecs.slice(0, 6).map((s) => (
                <Link key={s.slug} to={`/busca?specialty=${s.slug}`} className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-sm backdrop-blur">
                  {s.icon} {s.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-6">
        {[
          { icon: Search, title: 'Busca inteligente', desc: 'Filtre por especialidade, convênio, localização e disponibilidade em tempo real.' },
          { icon: Calendar, title: 'Agende em 2 minutos', desc: 'Escolha profissional, dia e horário. Confirmação imediata.' },
          { icon: Bell, title: 'Lembretes automáticos', desc: 'E-mail, WhatsApp e notificações push antes da consulta.' },
          { icon: Star, title: 'Avaliações verificadas', desc: 'Opiniões de pacientes que realmente consultaram.' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200">
            <f.icon className="w-8 h-8 text-brand-600" />
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Specialties */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Especialidades populares</h2>
          <Link to="/especialidades" className="text-brand-600 text-sm font-medium flex items-center gap-1">Ver todas <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {popularSpecs.map((s) => (
            <Link key={s.slug} to={`/busca?specialty=${s.slug}`} className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md hover:border-brand-300 transition">
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-2 text-sm font-medium text-slate-700">{s.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top doctors */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Profissionais em destaque</h2>
          <Link to="/busca" className="text-brand-600 text-sm font-medium flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.doctors || []).map((d: any) => <DoctorCard key={d.id} d={d} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Busque', desc: 'Encontre especialistas por nome, especialidade, convênio ou localização.' },
              { n: '2', title: 'Agende', desc: 'Escolha o profissional, dia e horário que preferir. Em até 2 minutos.' },
              { n: '3', title: 'Consulte', desc: 'Receba lembretes e avalie o atendimento após a consulta.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Blog para pacientes</h2>
          <Link to="/blog" className="text-brand-600 text-sm font-medium flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {(articles || []).slice(0, 3).map((a: any) => (
            <Link key={a.slug} to={`/blog/${a.slug}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-300" />
              <div className="p-4">
                <span className="text-xs text-brand-600 font-medium">{a.specialty}</span>
                <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2">{a.title}</h3>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA profissional */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">É profissional de saúde? Comece a crescer já!</h2>
            <p className="mt-2 text-slate-300">Atraia pacientes, automatize tarefas e gerencie sua agenda em uma única plataforma.</p>
          </div>
          <Link to="/cadastro?role=doctor" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 rounded-full font-semibold shrink-0">Criar perfil gratuito</Link>
        </div>
      </section>
    </div>
  );
}