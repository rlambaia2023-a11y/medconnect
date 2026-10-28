'use strict';
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../auth');

router.get('/mine', auth, (req, res) => {
  if (req.user.role === 'patient') {
    const rows = db.prepare(`SELECT a.*, d.id as doctor_id, u.name as doctor_name, s.name as service_name, addr.city as city
      FROM appointments a JOIN doctors d ON d.id=a.doctor_id JOIN users u ON u.id=d.user_id
      LEFT JOIN services s ON s.id=a.service_id LEFT JOIN addresses addr ON addr.id=a.address_id
      WHERE a.patient_id=? ORDER BY a.start DESC`).all(req.user.id);
    return res.json(rows);
  }
  if (req.user.role === 'doctor') {
    const doc = db.prepare('SELECT id FROM doctors WHERE user_id=?').get(req.user.id);
    const rows = db.prepare(`SELECT a.*, u.name as patient_name, s.name as service_name, addr.city as city
      FROM appointments a JOIN users u ON u.id=a.patient_id LEFT JOIN services s ON s.id=a.service_id LEFT JOIN addresses addr ON addr.id=a.address_id
      WHERE a.doctor_id=? ORDER BY a.start DESC`).all(doc.id);
    return res.json(rows);
  }
  res.json([]);
});

router.post('/', auth, (req, res) => {
  const { doctor_id, service_id, address_id, start, modality, notes } = req.body;
  const doc = db.prepare('SELECT * FROM doctors WHERE id=?').get(doctor_id);
  if (!doc) return res.status(404).json({ erro: 'Médico não encontrado' });
  const svc = service_id ? db.prepare('SELECT * FROM services WHERE id=?').get(service_id) : null;
  const duration = svc?.duration_min || 30;
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + duration*60000);
  // conflict check
  const conflict = db.prepare("SELECT id FROM appointments WHERE doctor_id=? AND status NOT IN ('cancelled') AND start < ? AND end > ?").get(doctor_id, endDate.toISOString(), startDate.toISOString());
  if (conflict) return res.status(409).json({ erro: 'Horário indisponível' });
  const price = svc?.price || 0;
const crypto = require('crypto');
// ... 
  const meeting_url = (modality === 'online' || modality === 'teleconsulta') ? `https://meet.jit.si/medconnect-${crypto.randomUUID()}` : null;
  const r = db.prepare('INSERT INTO appointments (patient_id,doctor_id,service_id,address_id,start,end,modality,status,price,notes,meeting_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(req.user.id, doctor_id, service_id, address_id, startDate.toISOString(), endDate.toISOString(), modality || 'presencial', 'scheduled', price, notes, meeting_url);
  const appt = db.prepare('SELECT * FROM appointments WHERE id=?').get(r.lastInsertRowid);
  // update patient_count
  db.prepare('UPDATE doctors SET patient_count = patient_count + 1 WHERE id=?').run(doctor_id);
  res.json(appt);
});

router.put('/:id', auth, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id=?').get(req.params.id);
  if (!appt) return res.status(404).json({ erro: 'Não encontrado' });
  if (req.user.role === 'patient' && appt.patient_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão' });
  if (req.user.role === 'doctor') {
    const doc = db.prepare('SELECT id FROM doctors WHERE user_id=?').get(req.user.id);
    if (appt.doctor_id !== doc.id) return res.status(403).json({ erro: 'Sem permissão' });
  }
  const { status, notes, start } = req.body;
  if (status) db.prepare('UPDATE appointments SET status=? WHERE id=?').run(status, appt.id);
  if (notes !== undefined) db.prepare('UPDATE appointments SET notes=? WHERE id=?').run(notes, appt.id);
  if (start) {
    const svc = appt.service_id ? db.prepare('SELECT duration_min FROM services WHERE id=?').get(appt.service_id) : null;
    const dur = svc?.duration_min || 30;
    const s = new Date(start); const e = new Date(s.getTime()+dur*60000);
    db.prepare('UPDATE appointments SET start=?,end=? WHERE id=?').run(s.toISOString(), e.toISOString(), appt.id);
  }
  res.json(db.prepare('SELECT * FROM appointments WHERE id=?').get(appt.id));
});

router.delete('/:id', auth, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id=?').get(req.params.id);
  if (!appt) return res.status(404).json({ erro: 'Não encontrado' });
  if (req.user.role === 'patient' && appt.patient_id !== req.user.id) return res.status(403).json({ erro: 'Sem permissão' });
  db.prepare("UPDATE appointments SET status='cancelled' WHERE id=?").run(appt.id);
  res.json({ ok: true });
});

// waitlist
router.post('/waitlist', auth, (req, res) => {
  const { doctor_id, desired_start } = req.body;
  db.prepare('INSERT INTO waitlist (patient_id,doctor_id,desired_start) VALUES (?,?,?)').run(req.user.id, doctor_id, desired_start);
  res.json({ ok: true });
});

module.exports = router;