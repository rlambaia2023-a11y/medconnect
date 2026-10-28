'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, optionalAuth, requireRole } = require('../auth');

// Diseases
router.get('/diseases', (req, res) => {
  const { q, letter, specialty } = req.query;
  let sql = 'SELECT * FROM diseases WHERE 1=1'; const p = [];
  if (q) { sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)'; p.push(`%${q.toLowerCase()}%`,`%${q.toLowerCase()}%`); }
  if (letter) { sql += ' AND LOWER(name) LIKE ?'; p.push(`${letter.toLowerCase()}%`); }
  if (specialty) { sql += ' AND specialty_slug=?'; p.push(specialty); }
  sql += ' ORDER BY name';
  res.json(db.prepare(sql).all(...p));
});
router.get('/diseases/:slug', (req, res) => {
  const d = db.prepare('SELECT * FROM diseases WHERE slug=?').get(req.params.slug);
  if (!d) return res.status(404).json({ erro: 'Não encontrado' });
  // related doctors
  const docs = db.prepare(`SELECT d.id,u.name FROM doctors d JOIN users u ON u.id=d.user_id
    JOIN doctor_specialties ds ON ds.doctor_id=d.id JOIN specialties s ON s.id=ds.specialty_id
    WHERE s.slug=? LIMIT 6`).all(d.specialty_slug);
  res.json({ ...d, doctors: docs });
});

// Medications
router.get('/medications', (req, res) => {
  const { q, letter } = req.query;
  let sql = 'SELECT * FROM medications WHERE 1=1'; const p = [];
  if (q) { sql += ' AND (LOWER(name) LIKE ? OR LOWER(active_ingredient) LIKE ?)'; p.push(`%${q.toLowerCase()}%`,`%${q.toLowerCase()}%`); }
  if (letter) { sql += ' AND LOWER(name) LIKE ?'; p.push(`${letter.toLowerCase()}%`); }
  sql += ' ORDER BY name';
  res.json(db.prepare(sql).all(...p));
});
router.get('/medications/:slug', (req, res) => {
  const m = db.prepare('SELECT * FROM medications WHERE slug=?').get(req.params.slug);
  if (!m) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(m);
});

// Articles
router.get('/articles', (req, res) => {
  const { specialty } = req.query;
  let sql = 'SELECT * FROM articles WHERE 1=1'; const p = [];
  if (specialty) { sql += ' AND specialty=?'; p.push(specialty); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...p));
});
router.get('/articles/:slug', (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE slug=?').get(req.params.slug);
  if (!a) return res.status(404).json({ erro: 'Não encontrado' });
  res.json(a);
});

// Q&A
router.get('/questions', (req, res) => {
  const { specialty } = req.query;
  let sql = `SELECT q.*, u.name as patient_name, s.name as specialty_name,
    (SELECT COUNT(*) FROM answers WHERE question_id=q.id) as answer_count
    FROM questions q LEFT JOIN users u ON u.id=q.patient_id LEFT JOIN specialties s ON s.id=q.specialty_id WHERE 1=1`;
  const p = [];
  if (specialty) { sql += ' AND s.slug=?'; p.push(specialty); }
  sql += ' ORDER BY q.created_at DESC LIMIT 50';
  const rows = db.prepare(sql).all(...p);
  const out = rows.map(q => ({ ...q, answers: db.prepare('SELECT a.*, u.name as doctor_name FROM answers a JOIN doctors d ON d.id=a.doctor_id JOIN users u ON u.id=d.user_id WHERE a.question_id=?').all(q.id) }));
  res.json(out);
});
router.post('/questions', optionalAuth, (req, res) => {
  const { specialty_id, title, body, anonymous } = req.body;
  if (!title) return res.status(400).json({ erro: 'Título obrigatório' });
  const pid = req.user ? req.user.id : null;
  const r = db.prepare('INSERT INTO questions (patient_id,specialty_id,title,body,anonymous) VALUES (?,?,?,?,?)').run(pid, specialty_id, title, body, anonymous ? 1 : 0);
  res.json(db.prepare('SELECT * FROM questions WHERE id=?').get(r.lastInsertRowid));
});
router.post('/questions/:id/answers', auth, requireRole('doctor','admin'), (req, res) => {
  const doc = db.prepare('SELECT id FROM doctors WHERE user_id=?').get(req.user.id);
  if (!doc) return res.status(403).json({ erro: 'Apenas médicos' });
  const { body } = req.body;
  if (!body) return res.status(400).json({ erro: 'Resposta vazia' });
  const r = db.prepare('INSERT INTO answers (question_id,doctor_id,body) VALUES (?,?,?)').run(req.params.id, doc.id, body);
  res.json(db.prepare('SELECT * FROM answers WHERE id=?').get(r.lastInsertRowid));
});

// Triage (rule-based)
const triageMap = [
  { keywords: ['peito','coração','palpitação','pressão alta','hipertensão'], specialty: 'cardiologista', msg: 'Sintomas cardiovasculares. Recomendamos um Cardiologista.' },
  { keywords: ['ansiedade','depressão','tristeza','pânico','insônia'], specialty: 'psicologo', msg: 'Sintomas de saúde mental. Recomendamos Psicólogo/Psiquiatra.' },
  { keywords: ['pele','acne','mancha','coceira'], specialty: 'dermatologista', msg: 'Sintomas dermatológicos. Recomendamos Dermatologista.' },
  { keywords: ['osso','joelho','dor nas costas','fratura'], specialty: 'ortopedista-traumatologista', msg: 'Sintomas ortopédicos. Recomendamos Ortopedista.' },
  { keywords: ['estômago','refluxo','intestino','diarreia'], specialty: 'clinico-geral', msg: 'Sintomas gastrointestinais. Recomendamos Clínico Geral.' },
  { keywords: ['olho','visão','miopia'], specialty: 'oftalmologista', msg: 'Sintomas oculares. Recomendamos Oftalmologista.' },
  { keywords: ['dente','gengiva','cárie'], specialty: 'dentista', msg: 'Sintomas odontológicos. Recomendamos Dentista.' },
  { keywords: ['criança','bebê','febre infantil'], specialty: 'pediatra', msg: 'Saúde infantil. Recomendamos Pediatra.' },
];
router.post('/triage', (req, res) => {
  const text = (req.body.text || '').toLowerCase();
  const match = triageMap.find(t => t.keywords.some(k => text.includes(k)));
  if (match) return res.json({ specialty: match.specialty, message: match.msg });
  res.json({ specialty: 'clinico-geral', message: 'Não identificamos especialidade específica. Recomendamos começar com Clínico Geral.' });
});

module.exports = router;