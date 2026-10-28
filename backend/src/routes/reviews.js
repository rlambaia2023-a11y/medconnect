'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../auth');

router.get('/doctor/:id', (req, res) => {
  const rows = db.prepare('SELECT r.*, u.name as patient_name FROM reviews r JOIN users u ON u.id=r.patient_id WHERE r.doctor_id=? ORDER BY r.created_at DESC').all(req.params.id);
  res.json(rows);
});

router.post('/', auth, (req, res) => {
  const { appointment_id, doctor_id, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ erro: 'Rating inválido' });
  // verify appointment belongs to patient & completed
  let level = 'basic';
  if (appointment_id) {
    const appt = db.prepare('SELECT * FROM appointments WHERE id=? AND patient_id=?').get(appointment_id, req.user.id);
    if (appt) level = appt.paid ? 'payment' : 'appointment';
  }
  const r = db.prepare('INSERT INTO reviews (appointment_id,patient_id,doctor_id,rating,comment,verified_level) VALUES (?,?,?,?,?,?)').run(appointment_id, req.user.id, doctor_id, rating, comment, level);
  // update doctor rating
  const agg = db.prepare('SELECT AVG(rating) avg, COUNT(*) c FROM reviews WHERE doctor_id=?').get(doctor_id);
  db.prepare('UPDATE doctors SET rating=?, review_count=? WHERE id=?').run(Math.round(agg.avg*10)/10, agg.c, doctor_id);
  res.json(db.prepare('SELECT * FROM reviews WHERE id=?').get(r.lastInsertRowid));
});

module.exports = router;