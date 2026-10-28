'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../auth');

router.get('/inbox', auth, (req, res) => {
  const rows = db.prepare(`SELECT m.*, u.name as from_name FROM messages m JOIN users u ON u.id=m.from_user
    WHERE m.to_user=? ORDER BY m.created_at DESC`).all(req.user.id);
  res.json(rows);
});
router.get('/thread/:userId', auth, (req, res) => {
  const other = Number(req.params.userId);
  const rows = db.prepare(`SELECT m.*, u.name as from_name FROM messages m JOIN users u ON u.id=m.from_user
    WHERE (m.from_user=? AND m.to_user=?) OR (m.from_user=? AND m.to_user=?) ORDER BY m.created_at ASC`).all(req.user.id, other, other, req.user.id);
  db.prepare('UPDATE messages SET read=1 WHERE to_user=? AND from_user=?').run(req.user.id, other);
  res.json(rows);
});
router.post('/', auth, (req, res) => {
  const { to_user, body, appointment_id } = req.body;
  if (!to_user || !body) return res.status(400).json({ erro: 'Campos obrigatórios' });
  const r = db.prepare('INSERT INTO messages (from_user,to_user,appointment_id,body) VALUES (?,?,?,?)').run(req.user.id, to_user, appointment_id, body);
  res.json(db.prepare('SELECT * FROM messages WHERE id=?').get(r.lastInsertRowid));
});

// favorites
router.get('/favorites', auth, (req, res) => {
  const rows = db.prepare('SELECT d.id,u.name FROM favorites f JOIN doctors d ON d.id=f.doctor_id JOIN users u ON u.id=d.user_id WHERE f.user_id=?').all(req.user.id);
  res.json(rows);
});
router.post('/favorites/:doctorId', auth, (req, res) => {
  try { db.prepare('INSERT INTO favorites (user_id,doctor_id) VALUES (?,?)').run(req.user.id, req.params.doctorId); } catch(e){}
  res.json({ ok: true });
});
router.delete('/favorites/:doctorId', auth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id=? AND doctor_id=?').run(req.user.id, req.params.doctorId);
  res.json({ ok: true });
});

module.exports = router;