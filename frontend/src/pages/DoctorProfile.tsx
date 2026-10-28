import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Star, Video, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { formatCurrency, formatDate } from '../lib/utils';

export default function DoctorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('sobre');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [slot, setSlot] = useState<string | null>(null);
  const [modality, setModality] = useState('presencial');
  const [bookingMsg, setBookingMsg] = useState('');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => (await api.get(`/doctors/${id}`)).data,
  });

  const { data: slots } = useQuery({
    queryKey: ['slots', id, date],
    queryFn: async () => (await api.get(`/doctors/${id}/slots`, { params: { date } })).data,
    enabled: !!id,
  });

  const book = useMutation({
    mutationFn: async () => {
      const start = `${date}T${slot}:00`;
      return (await api.post('/appointments', {
        doctor_id: Number(id),
        service_id: selectedService?.id,
        address_id: selectedAddr?.id,
        start,
        modality,
        notes: bookingMsg,
      })).data;
    },
    onSuccess: () => {
      alert('Consulta agendada com sucesso!');
      navigate(user?.role === 'doctor' ? '/profissional' : '/paciente');
    },
    onError: (e: any) => alert(e.response?.data?.erro || 'Erro ao agendar'),
  });

  if (isLoading || !doc) return <div className="p-8 text-center">Carregando...</div>;

  const spec = doc.specialties?.map((s:any)=>s.name).join(', ');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shrink-0 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
            {doc.photo ? <img src={doc.photo} className="w-full h-full object-cover" /> : doc.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{doc.name}</h1>
              {doc.first_class ? <span className="text-xs font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">First Class</span> : null}
              {doc.verified ? <ShieldCheck className="w-5 h-5 text-blue-500" /> : null}
            </div>
            <p className="text-brand-600 font-medium mt-1">{spec}</p>
            <p className="text-sm text-slate-500 mt-1">{doc.crm} {doc.rqe ? `• RQE ${doc.rqe}` : ''}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> <strong>{doc.rating || '—'}</strong> ({doc.review_count} opiniões)</span>
              {doc.accepts_online ? <span className="flex items-center gap-1 text-emerald-600"><Video className="w-4 h-4" /> Teleconsulta</span> : null}
              <span className="text-slate-500">{doc.years_experience} anos de experiência</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <a href="#agendar" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-semibold">Agendar consulta</a>
              <button className="px-5 py-2.5 border border-slate-300 rounded-full font-medium flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Enviar mensagem</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {['sobre','servicos','consultorios','planos','opinioes','duvidas'].map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-5 py-3 text-sm font-medium whitespace-nowrap ${tab===t?'text-brand-600 border-b-2 border-brand-600':'text-slate-600'}`}>
              {t === 'sobre' ? 'Sobre' : t === 'servicos' ? 'Serviços' : t === 'consultorios' ? 'Consultórios' : t === 'planos' ? 'Planos' : t === 'opinioes' ? 'Opiniões' : 'Dúvidas'}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'sobre' && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Sobre mim</h3>
              <p className="text-slate-700 whitespace-pre-line">{doc.bio || 'Sem biografia.'}</p>
              <h3 className="font-semibold text-slate-900 mt-6 mb-2">Doenças tratadas</h3>
              <div className="flex flex-wrap gap-2">
                {(doc.diseases || []).map((d:any) => <span key={d} className="px-3 py-1 bg-slate-100 rounded-full text-sm">{d}</span>)}
              </div>
              <h3 className="font-semibold text-slate-900 mt-6 mb-2">Idiomas</h3>
              <p className="text-slate-700">Português</p>
            </div>
          )}
          {tab === 'servicos' && (
            <div className="space-y-3">
              {doc.services?.map((s:any) => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.duration_min} min {s.description ? `• ${s.description}` : ''}</div>
                  </div>
                  <div className="font-bold text-slate-900">{formatCurrency(s.price)}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'consultorios' && (
            <div className="space-y-4">
              {doc.addresses?.map((a:any) => (
                <div key={a.id} className="p-4 border border-slate-200 rounded-xl">
                  <div className="font-medium text-slate-900">{a.label}</div>
                  <p className="text-sm text-slate-600 mt-1">{a.street}, {a.city} - {a.state} {a.zip}</p>
                  {a.phone && <p className="text-sm text-slate-600 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.phone}</p>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`} target="_blank" rel="noreferrer" className="text-sm text-brand-600 mt-2 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Ver no mapa</a>
                </div>
              ))}
            </div>
          )}
          {tab === 'planos' && (
            <div className="flex flex-wrap gap-2">
              {doc.insurances?.length ? doc.insurances.map((i:string) => <span key={i} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">{i}</span>) : <p className="text-slate-500">Nenhum convênio informado.</p>}
            </div>
          )}
          {tab === 'opinioes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold text-slate-900">{doc.rating}</div>
                <div>
                  <div className="flex">{Array.from({length:5}).map((_,i)=> <Star key={i} className={`w-5 h-5 ${i < Math.round(doc.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
                  <div className="text-sm text-slate-500">{doc.review_count} opiniões</div>
                </div>
              </div>
              {doc.reviews?.map((r:any) => (
                <div key={r.id} className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">{r.patient_name?.charAt(0)}</div>
                    <div>
                      <div className="font-medium text-sm">{r.patient_name}</div>
                      <div className="flex">{Array.from({length:5}).map((_,i)=> <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
                    </div>
                    <span className="ml-auto text-xs text-slate-400">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{r.comment}</p>
                  <span className="text-xs text-emerald-600">{r.verified_level === 'payment' ? '✓ Pagamento e consulta verificados' : r.verified_level === 'appointment' ? '✓ Consulta verificada' : 'Opinião verificada'}</span>
                </div>
              ))}
              {user && (
                <ReviewForm doctorId={doc.id} />
              )}
            </div>
          )}
          {tab === 'duvidas' && (
            <div className="space-y-4">
              {doc.questions?.map((q:any) => (
                <div key={q.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="font-medium text-slate-900">{q.title}</div>
                  {q.body && <p className="text-sm text-slate-600 mt-1">{q.body}</p>}
                  {q.answers?.map((a:any) => (
                    <div key={a.id} className="mt-3 pl-4 border-l-2 border-brand-300">
                      <div className="text-sm font-medium text-brand-700">{a.doctor_name}</div>
                      <p className="text-sm text-slate-700">{a.body}</p>
                    </div>
                  ))}
                </div>
              ))}
              {doc.questions?.length === 0 && <p className="text-slate-500">Nenhuma dúvida respondida ainda.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Booking section */}
      <div id="agendar" className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Agendar consulta</h2>
        {!user ? (
          <div className="text-center py-6">
            <p className="text-slate-600 mb-3">Faça login para agendar sua consulta.</p>
            <Link to="/login" className="px-5 py-2.5 bg-brand-600 text-white rounded-full font-semibold">Entrar</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Serviço</label>
              <select className="w-full border rounded-lg py-2 px-3" value={selectedService?.id || ''} onChange={(e)=> setSelectedService(doc.services?.find((s:any)=>s.id===Number(e.target.value)))}>
                <option value="">Selecione</option>
                {doc.services?.map((s:any)=> <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Local</label>
              <select className="w-full border rounded-lg py-2 px-3" value={selectedAddr?.id || ''} onChange={(e)=> setSelectedAddr(doc.addresses?.find((a:any)=>a.id===Number(e.target.value)))}>
                <option value="">Selecione</option>
                {doc.addresses?.map((a:any)=> <option key={a.id} value={a.id}>{a.label} — {a.city}</option>)}
              </select>

              <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Modalidade</label>
              <div className="flex gap-2">
                <button onClick={()=>setModality('presencial')} className={`px-4 py-2 rounded-lg border text-sm ${modality==='presencial'?'bg-brand-600 text-white border-brand-600':'bg-white'}`}>Presencial</button>
                {doc.accepts_online ? <button onClick={()=>setModality('online')} className={`px-4 py-2 rounded-lg border text-sm ${modality==='online'?'bg-brand-600 text-white border-brand-600':'bg-white'}`}>Online</button> : null}
              </div>

              <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Data</label>
              <input type="date" value={date} onChange={(e)=>{setDate(e.target.value); setSlot(null);}} className="w-full border rounded-lg py-2 px-3" min={new Date().toISOString().slice(0,10)} />

              <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Observações</label>
              <textarea value={bookingMsg} onChange={(e)=>setBookingMsg(e.target.value)} className="w-full border rounded-lg py-2 px-3" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horários disponíveis</label>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {(slots?.slots || []).map((s:string) => (
                  <button key={s} onClick={()=>setSlot(s)} className={`py-2 rounded-lg border text-sm font-medium ${slot===s?'bg-brand-600 text-white border-brand-600':'bg-white hover:border-brand-400'}`}>{s}</button>
                ))}
                {(!slots?.slots || slots.slots.length === 0) && <p className="col-span-4 text-sm text-slate-500">Sem horários disponíveis nesta data.</p>}
              </div>
              <div className="mt-6">
                <button
                  disabled={!slot || !selectedService}
                  onClick={()=>book.mutate()}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold"
                >
                  {book.isPending ? 'Agendando...' : slot ? `Confirmar ${slot}` : 'Selecione um horário'}
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">Agendamento gratuito. Lembrete enviado automaticamente.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ doctorId }: { doctorId: number }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => (await api.post('/reviews', { doctor_id: doctorId, rating, comment })).data,
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['doctor'] }); alert('Avaliação enviada!'); },
  });
  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
      <h4 className="font-medium mb-2">Deixe sua avaliação</h4>
      <div className="flex gap-1 mb-2">
        {Array.from({length:5}).map((_,i)=> <button key={i} onClick={()=>setRating(i+1)}><Star className={`w-6 h-6 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}
      </div>
      <textarea value={comment} onChange={(e)=>setComment(e.target.value)} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Compartilhe sua experiência..." />
      <button onClick={()=>mut.mutate()} disabled={mut.isPending} className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Enviar</button>
    </div>
  );
}