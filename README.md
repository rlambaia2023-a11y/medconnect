# MedConnect — Plataforma de Saúde (evolução do Doctoralia)

Sistema full-stack (React + Node) inspirado no Doctoralia, com melhorias: busca inteligente, agendamento online, telemedicina (Jitsi), triagem por IA (rule-based), chat em tempo real (Socket.io), PWA, dark mode, painel profissional e administrativo.

## Estrutura
- `backend/` — API Express + SQLite (better-sqlite3) + Socket.io
- `frontend/` — React (Vite) + TypeScript + Tailwind

## Como rodar

### Backend
```bash
cd backend
npm install
npm start   # http://localhost:4000
```
Seed automático na primeira execução (usuários demo).

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxy para backend)
```

## Credenciais demo
- Paciente: `paciente@medconnect.com` / `demo123`
- Admin: `admin@medconnect.com` / `demo123`
- Médicos: `marcos@medconnect.com` / `demo123` etc.

## Funcionalidades
- Busca de profissionais por especialidade, cidade, convênio, modalidade, ordenação
- Perfil completo (bio, serviços/preços, endereços, planos, avaliações, Q&A)
- Agendamento online com slots em tempo real
- Telemedicina (link Jitsi gerado automaticamente)
- Avaliações verificadas (3 níveis)
- Q&A (Pergunte ao especialista)
- Conteúdo: doenças, medicamentos, blog
- Triagem inteligente de sintomas
- Painel do paciente (consultas, favoritos, mensagens)
- Painel profissional (agenda, edição de perfil, serviços, convênios, métricas)
- Painel admin (métricas globais)
- Chat privado (REST + Socket.io)
- PWA + dark mode

## Melhorias vs Doctoralia
- Stack moderna (React 19 + Vite 8 + Tailwind 4)
- Telemedicina aberta via Jitsi (sem lock-in)
- Triagem de sintomas integrada
- Chat em tempo real
- UX mais rápida (busca instantânea, filtros)
- Acessibilidade e dark mode
- Código aberto e auto-hospedável