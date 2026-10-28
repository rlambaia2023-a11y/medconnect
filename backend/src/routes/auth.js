'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { sign, bcrypt } = require('../auth');

router.post('/register', (req, res) => {
  const { name, email, password, role, phone, city, state } = req.body;
  if (!name || !email || !password) return res.status(400).json({ erro: 'Campos obrigatórios' });
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) return res.status(409).json({ erro: 'E-mail já cadastrado' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO users (name,email,password,role,phone,city,state) VALUES (?,?,?,?,?,?,?)').run(name, email, hash, role || 'patient', phone, city, state);
  const user = db.prepare('SELECT id,name,email,role,city,state,phone,avatar FROM users WHERE id=?').get(r.lastInsertRowid);
  if (role === 'doctor') {
    db.prepare('INSERT INTO doctors (user_id,bio) VALUES (?,?)').run(user.id, '');
  }
  res.json({ token: sign(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ erro: 'Credenciais inválidas' });
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, state: user.state, phone: user.phone, avatar: user.avatar };
  res.json({ token: sign(safe), user: safe });
});

router.get('/me', require('../auth').auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,city,state,phone,avatar,birthdate FROM users WHERE id=?').get(req.user.id);
  if (user.role === 'doctor') {
    user.doctor = db.prepare('SELECT * FROM doctors WHERE user_id=?').get(user.id);
  }
  res.json(user);
});

module.exports = router;