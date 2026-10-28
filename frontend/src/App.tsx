import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import DoctorProfile from './pages/DoctorProfile';
import PatientDashboard from './pages/PatientDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DiseasesList from './pages/DiseasesList';
import DiseaseDetail from './pages/DiseaseDetail';
import { MedicationsList, MedicationDetail } from './pages/Medications';
import QA from './pages/QA';
import Triage from './pages/Triage';
import { BlogList, BlogPost } from './pages/Blog';
import Login from './pages/Login';
import Register from './pages/Register';

const qc = new QueryClient();

function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const token = localStorage.getItem('mc_token');
  const user = JSON.parse(localStorage.getItem('mc_user') || 'null');
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/medico/:id" element={<DoctorProfile />} />
            <Route path="/doencas" element={<DiseasesList />} />
            <Route path="/doencas/:slug" element={<DiseaseDetail />} />
            <Route path="/medicamentos" element={<MedicationsList />} />
            <Route path="/medicamentos/:slug" element={<MedicationDetail />} />
            <Route path="/pergunte" element={<QA />} />
            <Route path="/triagem" element={<Triage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/paciente" element={<Protected><PatientDashboard /></Protected>} />
            <Route path="/profissional" element={<Protected roles={['doctor','admin']}><ProfessionalDashboard /></Protected>} />
            <Route path="/admin" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
            <Route path="*" element={<div className="p-8 text-center">Página não encontrada</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}