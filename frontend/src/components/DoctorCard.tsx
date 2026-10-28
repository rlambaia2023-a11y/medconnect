import { Link } from 'react-router-dom';
import { MapPin, Star, Video, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function DoctorCard({ d }: { d: any }) {
  const spec = d.specialties?.[0]?.name || 'Especialista';
  const addr = d.addresses?.[0];
  return (
    <Link to={`/medico/${d.id}`} className="block bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shrink-0 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
          {d.photo ? <img src={d.photo} alt={d.name} className="w-full h-full object-cover" /> : d.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 truncate">{d.name}</h3>
              <p className="text-sm text-brand-600">{spec}</p>
            </div>
            {d.first_class ? (
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">First Class</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {d.rating || '—'} ({d.review_count})</span>
            {d.accepts_online ? <span className="flex items-center gap-1"><Video className="w-4 h-4 text-emerald-500" /> Online</span> : null}
            {d.verified ? <ShieldCheck className="w-4 h-4 text-blue-500" /> : null}
          </div>
          {addr && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {addr.city} • {addr.label}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="text-sm">
          <span className="text-slate-500">A partir de </span>
          <span className="font-bold text-slate-900">{formatCurrency(d.minPrice)}</span>
        </div>
        <span className="text-sm font-medium text-brand-600">Ver perfil →</span>
      </div>
    </Link>
  );
}