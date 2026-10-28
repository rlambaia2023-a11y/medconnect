'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth } = require('../auth');

// list specialties
router.get('/specialties', (req, res) => {
  res.json(db.prepare('SELECT * FROM specialties ORDER BY name').all());
});

// search doctors
router.get('/', (req, res) => {
  const { q, specialty, city, insurance, modality, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
  let sql = `SELECT d.*, u.name, u.city, u.state, u.avatar FROM doctors d JOIN users u ON u.id=d.user_id WHERE 1=1`;
  const params = [];
  if (specialty) {
    sql += ` AND d.id IN (SELECT doctor_id FROM doctor_specialties ds JOIN specialties s ON s.id=ds.specialty_id WHERE s.slug=?)`;
    params.push(specialty);
  }
  if (city) { sql += ` AND (LOWER(u.city) LIKE ? OR LOWER(u.state) LIKE ?)`; params.push(`%${city.toLowerCase()}%`, `%${city.toLowerCase()}%`); }
  if (q) { sql += ` AND (LOWER(u.name) LIKE ? OR d.bio LIKE ?)`; params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`); }
  if (insurance) { sql += ` AND d.id IN (SELECT doctor_id FROM doctor_insurances WHERE insurance=?)`; params.push(insurance); }
  if (modality === 'online') { sql += ` AND d.accepts_online=1`; }
  // price filter via services
  // sort
  if (sort === 'rating') sql += ` ORDER BY d.rating DESC, d.review_count DESC`;
  else if (sort === 'price_asc') sql += ` ORDER BY (SELECT MIN(price) FROM services WHERE doctor_id=d.id) ASC`;
  else if (sort === 'price_desc') sql += ` ORDER BY (SELECT MIN(price) FROM services WHERE doctor_id=d.id) DESC`;
  else sql += ` ORDER BY d.first_class DESC, d.rating DESC, d.review_count DESC`;

  const offset = (Number(page)-1)*Number(limit);
  const total = db.prepare(sql.replace(/SELECT d\.\*, u\.name.*?FROM doctors d/, 'SELECT COUNT(*) c FROM doctors d')).get(...params)?.c || 0;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);
  const rows = db.prepare(sql).all(...params);

  const doctors = rows.map(d => {
    const specs = db.prepare('SELECT s.slug,s.name,s.icon FROM specialties s JOIN doctor_specialties ds ON ds.specialty_id=s.id WHERE ds.doctor_id=?').all(d.id);
    const services = db.prepare('SELECT * FROM services WHERE doctor_id=?').all(d.id);
    const addresses = db.prepare('SELECT * FROM addresses WHERE doctor_id=?').all(d.id);
    const insurances = db.prepare('SELECT insurance FROM doctor_insurances WHERE doctor_id=?').all(d.id).map(x=>x.insurance);
    const minPrice = services.length ? Math.min(...services.map(s=>s.price||0).filter(p=>p>0), Infinity) : null;
    return { ...d, specialties: specs, services, addresses, insurances, minPrice: minPrice===Infinity?null:minPrice };
  });
  res.json({ doctors, total, page: Number(page), limit: Number(limit) });
});

// doctor profile
router.get('/:id', (req, res) => {
  const d = db.prepare('SELECT d.*, u.name, u.city, u.state, u.avatar, u.email FROM doctors d JOIN users u ON u.id=d.user_id WHERE d.id=?').get(req.params.id);
  if (!d) return res.status(404).json({ erro: 'Não encontrado' });
  const specs = db.prepare('SELECT s.slug,s.name,s.icon FROM specialties s JOIN doctor_specialties ds ON ds.specialty_id=s.id WHERE ds.doctor_id=?').all(d.id);
  const services = db.prepare('SELECT * FROM services WHERE doctor_id=?').all(d.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE doctor_id=?').all(d.id);
  const insurances = db.prepare('SELECT insurance FROM doctor_insurances WHERE doctor_id=?').all(d.id).map(x=>x.insurance);
  const reviews = db.prepare('SELECT r.*, u.name as patient_name FROM reviews r JOIN users u ON u.id=r.patient_id WHERE r.doctor_id=? ORDER BY r.created_at DESC LIMIT 20').all(d.id);
  const questions = db.prepare('SELECT q.*, (SELECT COUNT(*) FROM answers WHERE question_id=q.id) as answer_count FROM questions q WHERE q.specialty_id IN (SELECT specialty_id FROM doctor_specialties WHERE doctor_id=?) ORDER BY q.created_at DESC LIMIT 10').all(d.id);
  const answered = questions.map(q => ({ ...q, answers: db.prepare('SELECT a.*, doc_u.name as doctor_name FROM answers a JOIN doctors dd ON dd.id=a.doctor_id JOIN users doc_u ON doc_u.id=dd.user_id WHERE a.question_id=?').all(q.id) }));
  const availability = db.prepare('SELECT * FROM availability WHERE doctor_id=?').all(d.id);
  res.json({ ...d, specialties: specs, services, addresses, insurances, reviews, questions: answered, availability });
});

// availability slots for a date
router.get('/:id/slots', (req, res) => {
  const { date } = req.query;
  const d = db.prepare('SELECT * FROM doctors WHERE id=?').get(req.params.id);
  if (!d) return res.status(404).json({ erro: 'Não encontrado' });
  const day = new Date(date).getDay();
  const avail = db.prepare('SELECT * FROM availability WHERE doctor_id=? AND weekday=?').all(d.id, day);
  const booked = db.prepare("SELECT start FROM appointments WHERE doctor_id=? AND date(start)=? AND status NOT IN ('cancelled')").all(d.id, date);
  const bookedSet = new Set(booked.map(b => new Date(b.start).toISOString().slice(11,16)));
  const slots = [];
  for (const a of avail) {
    const [sh,sm] = a.start_time.split(':').map(Number);
    const [eh,em] = a.end_time.split(':').map(Number);
    let cur = sh*60+sm;
    const end = eh*60+em;
    while (cur + a.slot_min <= end) {
      const hh = String(Math.floor(cur/60)).padStart(2,'0');
      const mm = String(cur%60).padStart(2,'0');
      const t = `${hh}:${mm}`;
      if (!bookedSet.has(t)) slots.push(t);
      cur += a.slot_min;
    }
  }
  res.json({ date, slots });
});

// insurances list
router.get('/meta/insurances', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT insurance FROM doctor_insurances ORDER BY insurance').all();
  res.json(rows.map(r=>r.insurance));
});

// cities
router.get('/meta/cities', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT city FROM users WHERE role="doctor" ORDER BY city').all();
  res.json(rows.map(r=>r.city));
});

module.exports = router;