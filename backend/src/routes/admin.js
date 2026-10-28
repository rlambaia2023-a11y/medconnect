'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../auth');

router.get('/stats', auth, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const doctors = db.prepare('SELECT COUNT(*) c FROM doctors').get().c;
  const appointments = db.prepare('SELECT COUNT(*) c FROM appointments').get().c;
  const reviews = db.prepare('SELECT COUNT(*) c FROM reviews').get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(price),0) s FROM appointments WHERE status IN ('completed','scheduled')").get().s;
  const byStatus = db.prepare('SELECT status, COUNT(*) c FROM appointments GROUP BY status').all();
  const topDoctors = db.prepare('SELECT d.id,u.name,d.rating,d.review_count FROM doctors d JOIN users u ON u.id=d.user_id ORDER BY d.rating DESC LIMIT 5').all();
  res.json({ users, doctors, appointments, reviews, revenue, byStatus, topDoctors });
});

// professional dashboard
router.get('/professional/me', auth, requireRole('doctor'), (req, res) => {
  const doc = db.prepare('SELECT d.*, u.name,u.email,u.city,u.state FROM doctors d JOIN users u ON u.id=d.user_id WHERE d.user_id=?').get(req.user.id);
  const services = db.prepare('SELECT * FROM services WHERE doctor_id=?').all(doc.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE doctor_id=?').all(doc.id);
  const insurances = db.prepare('SELECT insurance FROM doctor_insurances WHERE doctor_id=?').all(doc.id).map(x=>x.insurance);
  const appointments = db.prepare(`SELECT a.*, u.name as patient_name FROM appointments a JOIN users u ON u.id=a.patient_id WHERE a.doctor_id=? ORDER BY a.start DESC LIMIT 50`).all(doc.id);
  const reviews = db.prepare('SELECT r.*, u.name as patient_name FROM reviews r JOIN users u ON u.id=r.patient_id WHERE r.doctor_id=? ORDER BY r.created_at DESC LIMIT 20').all(doc.id);
  const stats = {
    totalAppointments: db.prepare('SELECT COUNT(*) c FROM appointments WHERE doctor_id=?').get(doc.id).c,
    completed: db.prepare("SELECT COUNT(*) c FROM appointments WHERE doctor_id=? AND status='completed'").get(doc.id).c,
    cancelled: db.prepare("SELECT COUNT(*) c FROM appointments WHERE doctor_id=? AND status='cancelled'").get(doc.id).c,
    revenue: db.prepare("SELECT COALESCE(SUM(price),0) s FROM appointments WHERE doctor_id=? AND status IN ('completed','scheduled')").get(doc.id).s,
    avgRating: doc.rating,
  };
  res.json({ doctor: doc, services, addresses, insurances, appointments, reviews, stats });
});

// update doctor profile
router.put('/professional/me', auth, requireRole('doctor'), (req, res) => {
  const doc = db.prepare('SELECT id FROM doctors WHERE user_id=?').get(req.user.id);
  const { bio, accepts_online, services, addresses, insurances } = req.body;
  if (bio !== undefined) db.prepare('UPDATE doctors SET bio=? WHERE id=?').run(bio, doc.id);
  if (accepts_online !== undefined) db.prepare('UPDATE doctors SET accepts_online=? WHERE id=?').run(accepts_online ? 1 : 0, doc.id);
  if (Array.isArray(services)) {
    db.prepare('DELETE FROM services WHERE doctor_id=?').run(doc.id);
    const ins = db.prepare('INSERT INTO services (doctor_id,name,price,duration_min,description) VALUES (?,?,?,?,?)');
    for (const s of services) ins.run(doc.id, s.name, s.price, s.duration_min || 30, s.description || null);
  }
  if (Array.isArray(addresses)) {
    db.prepare('DELETE FROM addresses WHERE doctor_id=?').run(doc.id);
    const ins = db.prepare('INSERT INTO addresses (doctor_id,label,street,city,state,zip,lat,lng,phone) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const a of addresses) ins.run(doc.id, a.label, a.street, a.city, a.state, a.zip, a.lat || null, a.lng || null, a.phone || null);
  }
  if (Array.isArray(insurances)) {
    db.prepare('DELETE FROM doctor_insurances WHERE doctor_id=?').run(doc.id);
    const ins = db.prepare('INSERT INTO doctor_insurances (doctor_id,insurance) VALUES (?,?)');
    for (const i of insurances) ins.run(doc.id, i);
  }
  res.json({ ok: true });
});

module.exports = router;