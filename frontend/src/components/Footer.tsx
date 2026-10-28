import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-white mb-3">MedConnect</h4>
          <p className="text-sm">Plataforma de saúde que conecta pacientes e profissionais. Evoluindo o agendamento médico.</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Pacientes</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/busca" className="hover:text-white">Buscar especialistas</Link></li>
            <li><Link to="/doencas" className="hover:text-white">Doenças</Link></li>
            <li><Link to="/medicamentos" className="hover:text-white">Medicamentos</Link></li>
            <li><Link to="/pergunte" className="hover:text-white">Pergunte ao especialista</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Profissionais</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/cadastro?role=doctor" className="hover:text-white">Criar perfil</Link></li>
            <li><Link to="/profissional" className="hover:text-white">Painel profissional</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Privacidade</a></li>
            <li><a href="#" className="hover:text-white">Termos</a></li>
            <li><a href="#" className="hover:text-white">Contato</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 text-center text-xs py-4 text-slate-500">
        © {new Date().getFullYear()} MedConnect — Todos os direitos reservados.
      </div>
    </footer>
  );
}