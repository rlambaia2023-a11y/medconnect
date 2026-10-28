'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'medconnect.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'patient', -- patient | doctor | admin
  avatar TEXT,
  city TEXT,
  state TEXT,
  birthdate TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS specialties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crm TEXT,
  rqe TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  first_class INTEGER DEFAULT 0,
  accepts_online INTEGER DEFAULT 1,
  photo TEXT,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  patient_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctor_specialties (
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat REAL,
  lng REAL,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL,
  price_from INTEGER DEFAULT 0,
  duration_min INTEGER DEFAULT 30,
  description TEXT
);

CREATE TABLE IF NOT EXISTS doctor_insurances (
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  insurance TEXT NOT NULL,
  PRIMARY KEY (doctor_id, insurance)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES users(id),
  doctor_id INTEGER REFERENCES doctors(id),
  service_id INTEGER REFERENCES services(id),
  address_id INTEGER REFERENCES addresses(id),
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  modality TEXT DEFAULT 'presencial', -- presencial | online
  status TEXT DEFAULT 'scheduled', -- scheduled | confirmed | completed | cancelled | no_show
  price REAL,
  paid INTEGER DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER REFERENCES appointments(id),
  patient_id INTEGER REFERENCES users(id),
  doctor_id INTEGER REFERENCES doctors(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  verified_level TEXT DEFAULT 'basic', -- basic | appointment | payment
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES users(id),
  specialty_id INTEGER REFERENCES specialties(id),
  title TEXT NOT NULL,
  body TEXT,
  anonymous INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id),
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diseases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  symptoms TEXT,
  treatment TEXT,
  specialty_slug TEXT
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active_ingredient TEXT,
  description TEXT,
  usage TEXT,
  side_effects TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  specialty TEXT,
  excerpt TEXT,
  content TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER REFERENCES users(id),
  to_user INTEGER REFERENCES users(id),
  appointment_id INTEGER REFERENCES appointments(id),
  body TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES users(id),
  doctor_id INTEGER REFERENCES doctors(id),
  desired_start TEXT,
  notified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL, -- 0..6
  start_time TEXT NOT NULL, -- HH:MM
  end_time TEXT NOT NULL,
  slot_min INTEGER DEFAULT 30
);
`);

// seed specialties
const specCount = db.prepare('SELECT COUNT(*) c FROM specialties').get().c;
if (specCount === 0) {
  const specs = [
    ['cardiologista','Cardiologista','❤️'],
    ['psiquiatra','Psiquiatra','🧠'],
    ['psicologo','Psicólogo','💬'],
    ['ortopedista-traumatologista','Ortopedista - Traumatologista','🦴'],
    ['dermatologista','Dermatologista','✨'],
    ['endocrinologista','Endocrinologista','⚗️'],
    ['oftalmologista','Oftalmologista','👁️'],
    ['urologista','Urologista','🔬'],
    ['neurologista','Neurologista','⚡'],
    ['dentista','Dentista','🦷'],
    ['nutricionista','Nutricionista','🥗'],
    ['ginecologista','Ginecologista','🌸'],
    ['pediatra','Pediatra','👶'],
    ['clinico-geral','Médico Clínico Geral','🩺'],
    ['oncologista','Oncologista','🎗️'],
    ['reumatologista','Reumatologista','🦵'],
  ];
  const ins = db.prepare('INSERT INTO specialties (slug,name,icon) VALUES (?,?,?)');
  for (const s of specs) ins.run(...s);
}

// seed demo doctors
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('demo123', 10);
  // admin
  const adminId = db.prepare('INSERT INTO users (name,email,password,role,city,state) VALUES (?,?,?,?,?,?)').run('Administrador','admin@medconnect.com',hash,'admin','São Paulo','SP').lastInsertRowid;
  // doctors
  const doctors = [
    { name:'Dr. Marcos Antonio Dantas de Almeida', email:'marcos@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 41719', bio:'Cardiologista com mais de 40 anos de experiência. Ex-médico assistente do Instituto de Doenças Cardio Pulmonar E.J. Zerbini.', specs:['cardiologista'], years:42, rating:4.9, reviews:1280, first:1, ins:['Cassi','Sul América Saúde','AMS Petrobrás'], services:[{name:'Consulta Cardiologia',price:800,duration:40},{name:'Primeira consulta Cardiologia',price:800,duration:60}], addr:{label:'Clínica Cardiológica Dr Marcos Dantas',street:'R. Martiniano de Carvalho, 864 (cj 602)',city:'São Paulo',state:'SP',zip:'01321-000',lat:-23.5663,lng:-46.6432,phone:'(11) 3289-6662'} },
    { name:'Dra. Maria Julia Montebeller Meneses', email:'mariajulia@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 201925', bio:'Cardiologista com foco em hemodinâmica e cardiologia intervencionista.', specs:['cardiologista'], years:8, rating:4.8, reviews:60, first:1, ins:['Unimed','Bradesco Saúde'], services:[{name:'Consulta Cardiologia',price:550,duration:30},{name:'Primeira consulta Cardiologia',price:550,duration:45}], addr:{label:'East Clinic',street:'Rua Vilela 652',city:'São Paulo',state:'SP',zip:'03313-000',lat:-23.5401,lng:-46.5664,phone:'(11) 99999-0001'} },
    { name:'Dr. Bernardo Gomel', email:'bernardo@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 230002', bio:'Cardiologista, especialista em insuficiência cardíaca e transplante cardíaco.', specs:['cardiologista'], years:12, rating:4.7, reviews:71, first:1, ins:['Amil','Golden Cross'], services:[{name:'Consulta Cardiologia',price:550,duration:30}], addr:{label:'Pinheiros',street:'Av. Brig. Faria Lima, 1461 - 6º andar',city:'São Paulo',state:'SP',zip:'01452-000',lat:-23.5702,lng:-46.6907,phone:'(11) 99999-0002'} },
    { name:'Dra. Gabriela Rodrigues de Oliveira', email:'gabriela@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 202257', bio:'Cardiologista e especialista em clínica médica. Eletrofisiologia clínica.', specs:['cardiologista'], years:6, rating:4.6, reviews:12, first:0, ins:['Unimed'], services:[{name:'Primeira consulta Cardiologia',price:0,duration:45},{name:'Consulta Cardiologia',price:0,duration:30}], addr:{label:'MEDVITAL',street:'Rua Domingos de Morais 2781',city:'São Paulo',state:'SP',zip:'04035-000',lat:-23.6009,lng:-46.6364,phone:'(11) 99999-0003'} },
    { name:'Dra. Aline Sammarco', email:'aline@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 168096', bio:'Cardiologista com foco em ecocardiografia.', specs:['cardiologista'], years:10, rating:4.5, reviews:5, first:0, ins:['Bradesco Saúde'], services:[{name:'Primeira consulta Cardiologia',price:600,duration:45},{name:'Consulta Cardiologia',price:450,duration:30}], addr:{label:'Clínica Sammarco',street:'Avenida Senador Casemiro da Rocha 609',city:'São Paulo',state:'SP',zip:'04047-000',lat:-23.6078,lng:-46.6407,phone:'(11) 99999-0004'} },
    { name:'Dr. Ricardo Mikio Yoshida', email:'ricardo@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 149223', bio:'Cardiologista. Especialista em hipertensão arterial. Prevenção e qualidade de vida.', specs:['cardiologista'], years:15, rating:4.7, reviews:170, first:0, ins:['Unimed','Amil'], services:[{name:'Primeira consulta Cardiologia',price:400,duration:45},{name:'Consulta Cardiologia',price:400,duration:30}], addr:{label:'Consultório Online',street:'Rua Marechal Barbacena',city:'São Paulo',state:'SP',zip:'03000-000',lat:-23.5554,lng:-46.5734,phone:'(11) 99999-0005'} },
    { name:'Dra. Priscila Gherardi Goldstein', email:'priscila@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 116108', bio:'Cardiologista. Cardiologia ambulatorial, doença arterial coronária, insuficiência cardíaca.', specs:['cardiologista'], years:14, rating:4.6, reviews:10, first:0, ins:['Sul América Saúde'], services:[{name:'Primeira consulta Cardiologia',price:800,duration:45}], addr:{label:'Consultório',street:'Avenida Angélica 2491',city:'São Paulo',state:'SP',zip:'01227-000',lat:-23.5538,lng:-46.6619,phone:'(11) 99999-0006'} },
    { name:'Dr. Pedro Bastos', email:'pedro@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 168070', bio:'Cardiologista. Ecocardiografia, doença arterial coronária, longevidade.', specs:['cardiologista'], years:12, rating:4.8, reviews:69, first:0, ins:['Unimed'], services:[{name:'Primeira consulta Cardiologia',price:650,duration:45},{name:'Consulta Cardiologia',price:650,duration:30}], addr:{label:'Dr Pedro Bastos',street:'Rua Agostinho Rodrigues Filho, 550',city:'São Paulo',state:'SP',zip:'04026-000',lat:-23.5996,lng:-46.6501,phone:'(11) 99999-0007'} },
    { name:'Dra. Neiva Beltrão', email:'neiva@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 200933', bio:'Cardiologista. Valvopatias.', specs:['cardiologista'], years:9, rating:4.5, reviews:8, first:0, ins:['Bradesco Saúde','Unimed'], services:[{name:'Primeira consulta Cardiologia',price:450,duration:45}], addr:{label:'Renacor',street:'Rua Viradouro 63',city:'São Paulo',state:'SP',zip:'04538-000',lat:-23.5855,lng:-46.6804,phone:'(11) 99999-0008'} },
    { name:'Dr. Guilherme Spina', email:'guilherme@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 84450', bio:'Cardiologista. Valvopatias, febre reumática, endocardite.', specs:['cardiologista'], years:20, rating:4.9, reviews:323, first:0, ins:['Unimed'], services:[{name:'Consulta Cardiologia',price:1100,duration:40}], addr:{label:'Consultório particular',street:'Rua Caiowaa 1071',city:'São Paulo',state:'SP',zip:'05000-000',lat:-23.5377,lng:-46.6828,phone:'(11) 99999-0009'} },
    // multi-specialty doctors
    { name:'Dra. Ana Beatriz Lima', email:'ana@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 123456', bio:'Psicóloga clínica. Terapia cognitivo-comportamental. Atendimento adultos e adolescentes.', specs:['psicologo'], years:8, rating:4.9, reviews:45, first:1, ins:['Amil','Unimed','Bradesco Saúde'], services:[{name:'Consulta Psicologia',price:250,duration:50},{name:'Primeira consulta',price:300,duration:60}], addr:{label:'Consultório',street:'Rua Augusta 1500',city:'São Paulo',state:'SP',zip:'01305-000',lat:-23.557,lng:-46.658,phone:'(11) 99999-0010'} },
    { name:'Dr. Carlos Eduardo Silva', email:'carlos@medconnect.com', city:'Rio de Janeiro', state:'RJ', crm:'CRM RJ 98765', bio:'Psiquiatra. Transtornos de humor, ansiedade, TDAH.', specs:['psiquiatra'], years:12, rating:4.8, reviews:88, first:1, ins:['Sul América Saúde','Golden Cross'], services:[{name:'Consulta Psiquiatria',price:400,duration:40}], addr:{label:'Consultório',street:'Av. Atlântica 1000',city:'Rio de Janeiro',state:'RJ',zip:'22010-000',lat:-22.971,lng:-43.182,phone:'(21) 99999-0011'} },
    { name:'Dra. Fernanda Costa', email:'fernanda@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 234567', bio:'Dermatologista. Acne, melasma, procedimentos estéticos.', specs:['dermatologista'], years:6, rating:4.7, reviews:30, first:0, ins:['Unimed'], services:[{name:'Consulta Dermatologia',price:350,duration:30},{name:'Procedimento estético',price:800,duration:60}], addr:{label:'Clínica Derma',street:'Rua Oscar Freire 800',city:'São Paulo',state:'SP',zip:'01426-000',lat:-23.563,lng:-46.670,phone:'(11) 99999-0012'} },
    { name:'Dr. João Pedro Almeida', email:'joao@medconnect.com', city:'Brasília', state:'DF', crm:'CRM DF 345678', bio:'Ortopedista. Joelho, ombro, medicina esportiva.', specs:['ortopedista-traumatologista'], years:10, rating:4.6, reviews:55, first:0, ins:['Unimed','Amil'], services:[{name:'Consulta Ortopedia',price:300,duration:30}], addr:{label:'Orto Center',street:'SQS 308 Bloco A',city:'Brasília',state:'DF',zip:'70357-000',lat:-15.826,lng:-47.921,phone:'(61) 99999-0013'} },
    { name:'Dra. Beatriz Hashimoto', email:'beatriz@medconnect.com', city:'São Paulo', state:'SP', crm:'CRM SP 456789', bio:'Cardiologista pediátrica. Ecocardiografia fetal e pediátrica.', specs:['cardiologista','pediatra'], years:9, rating:4.9, reviews:701, first:1, ins:['Unimed','Bradesco Saúde'], services:[{name:'Consulta Cardiologia Pediátrica',price:560,duration:40}], addr:{label:'Clínica Ecokid',street:'Alameda Santos, 211, Conj 704',city:'São Paulo',state:'SP',zip:'01418-000',lat:-23.571,lng:-46.647,phone:'(11) 99999-0014'} },
  ];

  const insertUser = db.prepare('INSERT INTO users (name,email,password,role,city,state,phone) VALUES (?,?,?,?,?,?,?)');
  const insertDoctor = db.prepare('INSERT INTO doctors (user_id,crm,bio,years_experience,verified,first_class,rating,review_count,photo) VALUES (?,?,?,?,?,?,?,?,?)');
  const insertDS = db.prepare('INSERT INTO doctor_specialties (doctor_id,specialty_id) VALUES (?,?)');
  const getSpec = db.prepare('SELECT id FROM specialties WHERE slug=?');
  const insertAddr = db.prepare('INSERT INTO addresses (doctor_id,label,street,city,state,zip,lat,lng,phone) VALUES (?,?,?,?,?,?,?,?,?)');
  const insertSvc = db.prepare('INSERT INTO services (doctor_id,name,price,duration_min) VALUES (?,?,?,?)');
  const insertIns = db.prepare('INSERT INTO doctor_insurances (doctor_id,insurance) VALUES (?,?)');
  const insertAvail = db.prepare('INSERT INTO availability (doctor_id,weekday,start_time,end_time,slot_min) VALUES (?,?,?,?,?)');

  for (const d of doctors) {
    const uid = insertUser.run(d.name, d.email, hash, 'doctor', d.city, d.state, d.addr.phone).lastInsertRowid;
    const did = insertDoctor.run(uid, d.crm, d.bio, d.years, 1, d.first ? 1 : 0, d.rating, d.reviews, null).lastInsertRowid;
    for (const s of d.specs) {
      const sp = getSpec.get(s);
      if (sp) insertDS.run(did, sp.id);
    }
    insertAddr.run(did, d.addr.label, d.addr.street, d.addr.city, d.addr.state, d.addr.zip, d.addr.lat, d.addr.lng, d.addr.phone);
    for (const sv of d.services) insertSvc.run(did, sv.name, sv.price, sv.duration);
    for (const ins of d.ins) insertIns.run(did, ins);
    // availability mon-fri 8-18
    for (let w = 1; w <= 5; w++) insertAvail.run(did, w, '08:00', '18:00', 30);
    insertAvail.run(did, 6, '09:00', '13:00', 30);
  }

  // demo patient
  const pid = insertUser.run('Paciente Demo','paciente@medconnect.com',hash,'patient','São Paulo','SP','(11) 98888-0000').lastInsertRowid;
  db.prepare('INSERT INTO favorites (user_id,doctor_id) VALUES (?,?)').run(pid, 1);

  // seed diseases
  const diseases = [
    ['hipertensao','Hipertensão','Pressão alta crônica.','Dor de cabeça, tontura, visão turva.','Controle com medicamentos e estilo de vida.','cardiologista'],
    ['diabetes','Diabetes mellitus','Alteração do metabolismo da glicose.','Sede excessiva, poliúria, fadiga.','Dieta, exercícios, hipoglicemiantes.','endocrinologista'],
    ['depressao','Depressão','Transtorno de humor.','Tristeza persistente, anedonia.','Psicoterapia e/ou antidepressivos.','psiquiatra'],
    ['ansiedade','Ansiedade','Preocupação excessiva.','Taquicardia, sudorese, insônia.','Psicoterapia e técnicas de relaxamento.','psicologo'],
    ['asma','Asma','Inflamação crônica das vias aéreas.','Chiado, falta de ar.','Broncodilatadores e corticoides.','clinico-geral'],
    ['obesidade','Obesidade','Excesso de gordura corporal.','Ganho de peso, fadiga.','Dieta, exercícios, cirurgia bariátrica.','nutricionista'],
    ['covid-19','COVID-19','Infecção pelo SARS-CoV-2.','Febre, tosse, falta de ar.','Suporte e antivirais.','clinico-geral'],
    ['dengue','Dengue','Arbovirose transmitida pelo Aedes.','Febre alta, dor retro-orbital.','Hidratação e repouso.','clinico-geral'],
    ['hipotireoidismo','Hipotireoidismo','Baixa produção de hormônios tireoidianos.','Fadiga, ganho de peso, frio.','Levotiroxina.','endocrinologista'],
    ['rinite-alergica','Rinite alérgica','Inflamação nasal alérgica.','Espirros, coriza, coceira.','Anti-histamínicos.','alergista' in {} ? 'alergista' : 'clinico-geral'],
  ];
  const insD = db.prepare('INSERT INTO diseases (slug,name,description,symptoms,treatment,specialty_slug) VALUES (?,?,?,?,?,?)');
  for (const d of diseases) insD.run(...d);

  // seed medications
  const meds = [
    ['losartana','Losartana','Losartana potássica','Anti-hipertensivo (BRA).','Hipertensão, ICC.','Tontura, hipercalemia.'],
    ['metformina','Metformina','Cloridrato de metformina','Antidiabético biguanida.','Diabetes tipo 2.','Náusea, diarreia.'],
    ['sertralina','Sertralina','Cloridrato de sertralina','Antidepressivo ISRS.','Depressão, ansiedade.','Insônia, náusea.'],
    ['omeprazol','Omeprazol','Omeprazol','IBP.','DRGE, úlcera.','Cefaleia.'],
    ['atorvastatina','Atorvastatina','Atorvastatina cálcica','Estatina.','Dislipidemia.','Mialgia.'],
    ['amoxicilina','Amoxicilina','Amoxicilina','Antibiótico beta-lactâmico.','Infecções bacterianas.','Diarreia, alergia.'],
    ['dipirona','Dipirona','Metamizol sódico','Analgésico/antipirético.','Dor, febre.','Reações alérgicas.'],
    ['ibuprofeno','Ibuprofeno','Ibuprofeno','AINE.','Dor, inflamação.','Gastrite.'],
  ];
  const insM = db.prepare('INSERT INTO medications (slug,name,active_ingredient,description,usage,side_effects) VALUES (?,?,?,?,?,?)');
  for (const m of meds) insM.run(...m);

  // seed articles
  const arts = [
    ['obesidade-graus','Obesidade grau 1, 2 e 3: diferenças','Dr. Noe Alvarenga','Endocrinologia','Entenda as diferenças cruciais entre os graus de obesidade.','Conteúdo completo do artigo sobre obesidade...'],
    ['cirurgia-bariatrica','Cirurgia bariátrica: quando é indicada','Dr. Noe Alvarenga','Endocrinologia','Critérios de saúde para indicação.','Conteúdo...'],
    ['sistema-endocrino','Sistema Endócrino: O Que É','Dra. Raquel Martins','Endocrinologia','Entenda o sistema endócrino.','Conteúdo...'],
    ['hipertensao-controle','Como controlar a hipertensão','Dr. Marcos Dantas','Cardiologia','Dicas práticas.','Conteúdo...'],
  ];
  const insA = db.prepare('INSERT INTO articles (slug,title,author,specialty,excerpt,content) VALUES (?,?,?,?,?,?)');
  for (const a of arts) insA.run(...a);

  // seed Q&A
  const qid = db.prepare('INSERT INTO questions (patient_id,specialty_id,title,body,anonymous) VALUES (?,?,?,?,?)').run(pid, getSpec.get('cardiologista').id, 'Quando devo procurar um cardiologista?', 'Tenho palpitações ocasionais, preciso consultar?', 1).lastInsertRowid;
  db.prepare('INSERT INTO answers (question_id,doctor_id,body) VALUES (?,?,?)').run(qid, 1, 'Palpitações ocasionais podem ser benignas, mas se recorrentes ou acompanhadas de dor no peito/desmaio, procure avaliação.');

  // seed appointments + reviews for demo
  const now = new Date();
  const past = new Date(now.getTime() - 7*24*3600*1000);
  const apptId = db.prepare('INSERT INTO appointments (patient_id,doctor_id,service_id,address_id,start,end,modality,status,price,paid) VALUES (?,?,?,?,?,?,?,?,?,?)').run(pid, 1, 1, 1, past.toISOString(), new Date(past.getTime()+40*60000).toISOString(), 'presencial','completed', 800, 1).lastInsertRowid;
  db.prepare('INSERT INTO reviews (appointment_id,patient_id,doctor_id,rating,comment,verified_level) VALUES (?,?,?,?,?,?)').run(apptId, pid, 1, 5, 'Excelente médico, muito atencioso.', 'payment');

  console.log('Seed data created.');
}

// migration: meeting_url column
try { db.exec('ALTER TABLE appointments ADD COLUMN meeting_url TEXT'); } catch (e) {}

module.exports = db;