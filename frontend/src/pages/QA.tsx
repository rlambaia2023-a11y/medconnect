import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

export default function QA() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const { data: specs } = useQuery({ queryKey: ['specs'], queryFn: async () => (await api.get('/doctors/specialties')).data });
  const { data: questions } = useQuery({ queryKey: ['questions', filterSpec], queryFn: async () => (await api.get('/content/questions', { params: { specialty: filterSpec } })).data });

  const ask = useMutation({
    mutationFn: async () => (await api.post('/content/questions', { title, body, specialty_id: specs?.find((s:any)=>s.slug===specialty)?.id, anonymous: true })).data,
    onSuccess: () => { setTitle(''); setBody(''); qc.invalidateQueries({ queryKey: ['questions'] }); },
  });

  const answer = useMutation({
    mutationFn: async ({ qid, text }: any) => (await api.post(`/content/questions/${qid}/answers`, { body: text })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Pergunte ao especialista</h1>
      <p className="text-slate-600 mb-6">Tire suas dúvidas de saúde. Respostas de médicos e especialistas. Gratuito.</p>

      <div className="bg-white rounded-2xl border p-5 mb-6">
        <h3 className="font-semibold mb-3">Nova pergunta</h3>
        <select value={specialty} onChange={(e)=>setSpecialty(e.target.value)} className="w-full border rounded-lg py-2 px-3 mb-2">
          <option value="">Especialidade</option>
          {specs?.map((s:any)=> <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título da pergunta" className="w-full border rounded-lg py-2 px-3 mb-2" />
        <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Descreva sua dúvida..." className="w-full border rounded-lg py-2 px-3 mb-2" rows={3} />
        <button onClick={()=>ask.mutate()} disabled={!title || ask.isPending} className="px-5 py-2 bg-brand-600 text-white rounded-lg font-medium disabled:bg-slate-300">
          {ask.isPending ? 'Enviando...' : 'Enviar pergunta'}
        </button>
      </div>

      <div className="mb-4">
        <select value={filterSpec} onChange={(e)=>setFilterSpec(e.target.value)} className="border rounded-lg py-2 px-3">
          <option value="">Todas especialidades</option>
          {specs?.map((s:any)=> <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {(questions || []).map((q:any) => (
          <div key={q.id} className="bg-white rounded-2xl border p-5">
            <div className="font-semibold text-slate-900">{q.title}</div>
            {q.body && <p className="text-sm text-slate-600 mt-1">{q.body}</p>}
            <div className="text-xs text-slate-400 mt-2">{q.specialty_name} • {q.answer_count} resposta(s)</div>
            {(q.answers || []).map((a:any) => (
              <div key={a.id} className="mt-3 pl-4 border-l-2 border-brand-300">
                <div className="text-sm font-medium text-brand-700">{a.doctor_name}</div>
                <p className="text-sm text-slate-700">{a.body}</p>
              </div>
            ))}
            {user?.role === 'doctor' && (
              <AnswerBox onSubmit={(text:string)=>answer.mutate({qid: q.id, text})} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerBox({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Sua resposta..." className="flex-1 border rounded-lg py-2 px-3 text-sm" />
      <button onClick={()=>{ if(text){ onSubmit(text); setText(''); } }} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Responder</button>
    </div>
  );
}